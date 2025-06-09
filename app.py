import os
import json
import re
from flask import Flask, request, jsonify, send_from_directory
import anthropic
from dotenv import load_dotenv
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_compress import Compress
import logging
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
import hashlib
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST, Gauge
import time
from functools import wraps
import threading
from collections import deque
import statistics
import firebase_admin
from firebase_admin import credentials, auth, firestore

# Load environment variables
load_dotenv()

print("=== Flask app is starting up ===")

# Initialize Flask App
app = Flask(__name__, static_folder='static', static_url_path='')

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],  # In production, replace with specific origins
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure compression
Compress(app)

# Configure rate limiter with more granular limits
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Configure caching with Redis for production
if os.getenv('FLASK_ENV') == 'production':
    cache = Cache(app, config={
        'CACHE_TYPE': 'redis',
        'CACHE_REDIS_URL': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        'CACHE_DEFAULT_TIMEOUT': 300,
        'CACHE_THRESHOLD': 1000,  # Maximum number of items the cache will store
        'CACHE_KEY_PREFIX': 'rhyme_analysis_'
    })
else:
    cache = Cache(app, config={
        'CACHE_TYPE': 'simple',
        'CACHE_DEFAULT_TIMEOUT': 300,
        'CACHE_THRESHOLD': 1000,  # Maximum number of items the cache will store
        'CACHE_KEY_PREFIX': 'rhyme_analysis_'
    })

# Prometheus metrics
REQUEST_COUNT = Counter(
    'rhyme_analysis_requests_total',
    'Total number of rhyme analysis requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'rhyme_analysis_request_latency_seconds',
    'Request latency in seconds',
    ['method', 'endpoint']
)

ANALYSIS_CHARACTERS = Histogram(
    'rhyme_analysis_characters',
    'Number of characters analyzed',
    buckets=[100, 500, 1000, 2000, 5000, 10000]
)

CACHE_HITS = Counter(
    'rhyme_analysis_cache_hits_total',
    'Total number of cache hits'
)

CACHE_MISSES = Counter(
    'rhyme_analysis_cache_misses_total',
    'Total number of cache misses'
)

# Performance metrics
PATTERN_COUNTS = Counter(
    'rhyme_analysis_patterns_total',
    'Number of patterns found by type',
    ['pattern_type']
)

SEGMENT_COUNTS = Counter(
    'rhyme_analysis_segments_total',
    'Number of segments found by type',
    ['segment_type']
)

AVG_PATTERN_LENGTH = Gauge(
    'rhyme_analysis_avg_pattern_length',
    'Average length of patterns found'
)

PATTERN_DISTRIBUTION = Histogram(
    'rhyme_analysis_pattern_distribution',
    'Distribution of pattern lengths',
    buckets=[10, 20, 50, 100, 200, 500]
)

# Performance monitoring
class PerformanceMonitor:
    def __init__(self, max_samples=1000):
        self.response_times = deque(maxlen=max_samples)
        self.pattern_counts = deque(maxlen=max_samples)
        self.segment_counts = deque(maxlen=max_samples)
        self._lock = threading.Lock()

    def record_response_time(self, time_ms):
        with self._lock:
            self.response_times.append(time_ms)

    def record_pattern_count(self, count):
        with self._lock:
            self.pattern_counts.append(count)

    def record_segment_count(self, count):
        with self._lock:
            self.segment_counts.append(count)

    def get_stats(self):
        with self._lock:
            return {
                'avg_response_time': statistics.mean(self.response_times) if self.response_times else 0,
                'avg_patterns': statistics.mean(self.pattern_counts) if self.pattern_counts else 0,
                'avg_segments': statistics.mean(self.segment_counts) if self.segment_counts else 0
            }

performance_monitor = PerformanceMonitor()

# Memory-efficient caching
class MemoryEfficientCache:
    def __init__(self, max_size=1000):
        self.cache = {}
        self.max_size = max_size
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            return self.cache.get(key)

    def set(self, key, value, timeout=None):
        with self._lock:
            if len(self.cache) >= self.max_size:
                # Remove oldest item
                self.cache.pop(next(iter(self.cache)))
            self.cache[key] = value

    def clear(self):
        with self._lock:
            self.cache.clear()

# Initialize memory-efficient cache
memory_cache = MemoryEfficientCache()

# Monitoring decorator
def monitor_request(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            response = f(*args, **kwargs)
            status = response.status_code
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint,
                status=status
            ).inc()
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.endpoint
            ).observe(time.time() - start_time)
            return response
        except Exception as e:
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint,
                status=500
            ).inc()
            raise e
    return decorated_function

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    # Try to get credentials from environment variable first
    if os.getenv('FIREBASE_CREDENTIALS'):
        cred_dict = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
        cred = credentials.Certificate(cred_dict)
    # Then try to get from mounted volume
    elif os.path.exists('/secrets/my-rhyme-app-firebase-adminsdk-fbsvc-751e344993.json'):
        cred = credentials.Certificate('/secrets/my-rhyme-app-firebase-adminsdk-fbsvc-751e344993.json')
    else:
        raise ValueError("No Firebase credentials found. Please set FIREBASE_CREDENTIALS environment variable or mount the credentials file.")

    firebase_admin.initialize_app(cred)
db = firestore.client()

def is_firebase_admin_user(id_token):
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        user_doc = db.collection('users').document(uid).get()
        if user_doc.exists and user_doc.to_dict().get('admin', False):
            return True
    except Exception as e:
        print(f"Auth error: {e}")
    return False

@app.route('/metrics')
def metrics():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({"error": "Forbidden", "message": "Missing or invalid token."}), 403
    id_token = auth_header.split('Bearer ')[-1]
    if not is_firebase_admin_user(id_token):
        return jsonify({"error": "Forbidden", "message": "Admin access required."}), 403
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

# Configure logging
def setup_logger():
    logger = logging.getLogger()
    logHandler = RotatingFileHandler('app.log', maxBytes=100000, backupCount=5)
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(levelname)s %(name)s %(message)s'
    )
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    logger.setLevel(logging.INFO)
    return logger

logger = setup_logger()

# Input validation
def validate_text_input(text):
    if not text or not isinstance(text, str):
        raise ValueError("Invalid input: text must be a non-empty string")
    return text.strip()

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad Request", "message": str(error)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found", "message": str(error)}), 404

@app.errorhandler(429)
def too_many_requests(error):
    return jsonify({"error": "Too Many Requests", "message": str(error)}), 429

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal Server Error", "message": str(error)}), 500

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

def get_rhyme_analysis_from_claude(text_to_analyze, rhyme_scheme_key):
    try:
        client = anthropic.Client(api_key=os.getenv('ANTHROPIC_API_KEY'))
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            temperature=0.7,
            system="You are a helpful assistant that analyzes text for rhyme patterns and schemes.",
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this text for rhyme patterns and schemes: {text_to_analyze}"
                }
            ]
        )
        return response.content
    except Exception as e:
        logger.error(f"Error in Claude analysis: {str(e)}")
        raise

def generate_cache_key(text: str, rhyme_scheme: str) -> str:
    return hashlib.md5(f"{text}:{rhyme_scheme}".encode()).hexdigest()

@app.route('/api/analyze', methods=['POST'])
@limiter.limit("10 per minute")
@monitor_request
def analyze_text_route():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing text parameter"}), 400

        text_to_analyze = validate_text_input(data['text'])
        rhyme_scheme_key = data.get('rhyme_scheme', 'default')

        # Generate cache key
        cache_key = generate_cache_key(text_to_analyze, rhyme_scheme_key)

        # Check cache first
        cached_result = memory_cache.get(cache_key)
        if cached_result:
            CACHE_HITS.inc()
            return jsonify(cached_result)

        CACHE_MISSES.inc()

        # Perform analysis
        start_time = time.time()
        analysis_result = get_rhyme_analysis_from_claude(text_to_analyze, rhyme_scheme_key)
        analysis_time = time.time() - start_time

        # Record metrics
        ANALYSIS_CHARACTERS.observe(len(text_to_analyze))
        performance_monitor.record_response_time(analysis_time * 1000)  # Convert to milliseconds

        # Cache the result
        memory_cache.set(cache_key, analysis_result)

        return jsonify(analysis_result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in analyze_text_route: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8080)))
