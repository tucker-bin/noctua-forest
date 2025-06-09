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

try:
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
        cred = credentials.Certificate(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))
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
        if len(text) > 10000:  # Set reasonable limit
            raise ValueError("Text too long: maximum 10000 characters")
        return text.strip()

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        logger.error(f"Bad request: {str(error)}")
        return jsonify({
            "error": "Bad request",
            "message": str(error)
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        logger.error(f"Not found: {str(error)}")
        return jsonify({
            "error": "Not found",
            "message": str(error)
        }), 404

    @app.errorhandler(429)
    def too_many_requests(error):
        logger.error(f"Rate limit exceeded: {str(error)}")
        return jsonify({
            "error": "Too many requests",
            "message": "Rate limit exceeded"
        }), 429

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }), 500

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            "status": "healthy",
            "version": "1.0.0"
        }), 200

    # Configure Anthropic API
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    if not ANTHROPIC_API_KEY:
        print("WARNING: ANTHROPIC_API_KEY not found. Ensure it's set in your environment.")
        if "ANTHROPIC_API_KEY" not in os.environ: # For local dev fallback
            raise ValueError("ANTHROPIC_API_KEY is essential for analysis but not found. Please set it in your environment variables.")
        ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except Exception as e:
        raise ValueError(f"Oops! We couldn't connect to our analysis engine. Please ensure the API key is correctly set. (Details: {e})")

    # --- Model & Prompt Configurations ---
    CLAUDE_MODEL_NAME = "claude-3-5-sonnet-20240620"

    CLAUDE_MODEL_PARAMS = {
        "max_tokens": 4096, 
        "temperature": 0.1, 
        "top_p": 1.0,
        "top_k": 1, 
    }

    CLAUDE_SYSTEM_PROMPTS = {
        "phonetic_architecture": """You are a Master Forensic Phonetician and Lyrical Deconstructionist. Your analysis must be hyper-technical, focusing exclusively on the audible and structural phonetic properties of the provided text. You will identify and categorize all distinct 'phonetic linkage groups' based on shared phonetic segments, including intra-word segments. You will also prioritize which segments to report if overlaps occur, based on a complexity hierarchy, ensuring non-overlapping segments in the final output for any given text span. The 'text' field for each segment MUST be the literal substring from the input. Your responses must strictly adhere to the requested JSON format and the detailed instructions for sound analysis. IGNORE ALL SEMANTIC MEANING AND THEMATIC CONTENT. Your sole focus is the architecture of sound.""",
        "couplets_aa_bb": """You are a Lyrical Pattern Analyst specializing in identifying rhyming couplets (AA BB patterns). Focus on end-of-line rhymes. The input text might be a segment of a larger piece. Identify pairs of consecutive lines where the last words rhyme. Your response must be ONLY a single JSON object, adhering to the specified output structure. For each identified couplet (AA), the 'words' array should contain the two rhyming end-words. The 'pattern_description' should be 'Rhyming Couplet (AA): End words of two consecutive lines share a similar sound.' If multiple distinct couplets are found, list them as separate groups.""",
        "alternating_abab": """You are a Lyrical Pattern Analyst specializing in identifying alternating rhymes (ABAB patterns). Focus on end-of-line rhymes. The input text might be a segment of a larger piece. Identify sets of four lines where the first and third lines' end-words rhyme (A), and the second and fourth lines' end-words rhyme (B). Your response must be ONLY a single JSON object, adhering to the specified output structure. For each identified ABAB pattern, create two rhyme groups: 1. For the 'A' rhymes: 'words' array contains the two 'A' end-words. 'pattern_description' is 'Alternating Rhyme (A_AB_B): End words of lines 1 & 3 in an ABAB pattern share a similar sound.' 2. For the 'B' rhymes: 'words' array contains the two 'B' end-words. 'pattern_description' is 'Alternating Rhyme (A_B_AB): End words of lines 2 & 4 in an ABAB pattern share a similar sound.' List these groups separately.""",
        "enclosed_abba": """You are a Lyrical Pattern Analyst specializing in identifying enclosed rhymes (ABBA patterns). Focus on end-of-line rhymes. The input text might be a segment of a larger piece. Identify sets of four lines where the first and fourth lines' end-words rhyme (A), and the second and third lines' end-words rhyme (B). Your response must be ONLY a single JSON object, adhering to the specified output structure. For each identified ABBA pattern, create two rhyme groups: 1. For the 'A' rhymes: 'words' array contains the two 'A' end-words (from lines 1 & 4). 'pattern_description' is 'Enclosed Rhyme (A_BB_A): End words of lines 1 & 4 in an ABAB pattern share a similar sound.' 2. For the 'B' rhymes: 'words' array contains the two 'B' end-words (from lines 2 & 3). 'pattern_description' is 'Enclosed Rhyme (AB_B_A): End words of lines 2 & 3 in an ABAB pattern share a similar sound.' List these groups separately."""
    }

    OUTPUT_JSON_STRUCTURE_DESCRIPTION = """The JSON object must have a single top-level key: "phonetic_segment_groups".
The value of "phonetic_segment_groups" must be an array of objects.
Each object in the "phonetic_segment_groups" array represents a distinct shared sound pattern and must have three keys:
1. "phonetic_link_id": A unique string identifier for this specific sound pattern group (e.g., "sound_group_01", "sound_group_02"). All segments across the entire lyrics that share this exact sound pattern should have the same 'phonetic_link_id' in their respective group.
2. "pattern_description": A DETAILED and TECHNICALLY ACCURATE string (approx. 10-40 words) explaining the SPECIFIC phonetic feature(s) that link all segments in this group (e.g., "Shared /oʊd/ sound in stressed syllable.", "Multi-syllabic echo: shared /ɛl.ə.ti/ sequence in final unstressed syllables.").
3. "segments": An array of objects, where each object represents a specific occurrence of a phonetic segment sharing this sound pattern. Each segment object must have:
    a. "text": The actual string of the phonetic segment (e.g., "load", "ed", "cus", "sion"). **THIS MUST BE THE EXACT LITERAL SUBSTRING FROM THE ORIGINAL INPUT TEXT AS DEFINED BY globalStartIndex and globalEndIndex.**
    b. "parent_word_text": The full word this segment belongs to (e.g., "reloaded", "accustomed", "passionate").
    c. "globalStartIndex": The 0-based start index of this segment within the ENTIRE input lyric text.
    d. "globalEndIndex": The 0-based end index (exclusive) of this segment within the ENTIRE input lyric text.
    e. "startIndexInParentWord": The 0-based start index of this segment within its "parent_word_text".
    f. "endIndexInParentWord": The 0-based end index (exclusive) of this segment within its "parent_word_text".

Example:
{
  "phonetic_segment_groups": [
    {
      "phonetic_link_id": "sound_group_01",
      "pattern_description": "Shared /oʊd/ sound in stressed syllable.",
      "segments": [
        { "text": "load", "parent_word_text": "reloaded", "globalStartIndex": 5, "globalEndIndex": 9, "startIndexInParentWord": 2, "endIndexInParentWord": 6 }
      ]
    }
  ]
}
Ensure your response is ONLY the JSON object, with no other text before or after it.
"""

    PHONETIC_ARCHITECTURE_USER_PROMPT_CRITICAL_DIRECTIVES = """Your primary task is to perform an exhaustive, technically precise, and highly granular analysis of the provided LYRICAL text to identify ALL distinct 'phonetic linkage groups'. These groups are based on shared PHONETIC SEGMENTS.
This is a technical analysis of SOUND STRUCTURE ONLY. Disregard semantic meaning.

A 'phonetic linkage group' is defined by a unique shared sound pattern. All phonetic segments from the input text that exhibit this specific sound pattern belong to this group.

CRITICAL DIRECTIVES FOR YOUR ANALYSIS AND JSON OUTPUT:

1.  **INTRA-WORD PHONETIC SEGMENTATION & ACCURATE `text` FIELD (ABSOLUTELY CRITICAL):**
    *   Your analysis MUST extend to **intra-word phonetic segments**.
    *   For each identified phonetic segment, you MUST provide:
        a.  `text`: **This field is PARAMOUNT. It MUST be the EXACT literal substring** from the `parent_word_text` (from `startIndexInParentWord` to `endIndexInParentWord`). It ALSO MUST be the EXACT literal substring from the global input text (from `globalStartIndex` to `globalEndIndex`). **DO NOT provide an abstract phonetic component (e.g., just a vowel letter) if it's not the literal character(s) that form the segment at the given indices.** For instance, if "made" (/meɪd/) has an /eɪ/ sound, the segment `text` should be "ade" or "made", not just "a", depending on the identified segment boundaries.
        b.  `parent_word_text`: The full word it belongs to.
        c.  `globalStartIndex`, `globalEndIndex`, `startIndexInParentWord`, `endIndexInParentWord`: Precise 0-based indices.

2.  **`phonetic_link_id` ASSIGNMENT:** (Same as before)

3.  **Exhaustive Granularity & Multiplicity:** (Same as before, but encourage finding complex links) Strive to uncover the most intricate and complex phonetic structures, including multi-syllabic and intra-word links.

4.  **Types of Phonetic Links to Identify (applied to SEGMENTS):** (Multi-syllabic Phonetic Echoes, Internal Sound Linkages, Complex End-Rhyme, Specific Assonance/Consonance, Affixes, Slant/Near Rhymes).

5.  **STRICTLY AVOID WEAK LINKS FOR ISOLATED SHORT SEGMENTS/WORDS.** (Same as before)

6.  **Handling Simple Repetition:** (Same as before)

7.  **HIGHLIGHTING PRIORITIZATION & NON-OVERLAPPING OUTPUT (VISUALIZATION GOAL):**
    Your final JSON output must provide a clean set of segments ready for highlighting.
    *   **Identify All Potential Patterns:** Internally, identify all possible phonetic links and segments.
    *   **Apply Prioritization Hierarchy:** For any character range in the input text, if it's covered by segments from multiple potential patterns, select ONLY ONE segment for your final output JSON. This selection is based on the following priority (Priority 1 is highest):
        *   **Priority 1: Intra-Word Segment Links.** (e.g., "load" in "reloaded")
        *   **Priority 2: Multi-Syllabic Phonetic Echoes.**
        *   **Priority 3: Full Perfect Rhymes.**
        *   **Priority 4: Distinct Slant/Near Rhymes.**
        *   **Priority 5: Clear Internal Assonance/Consonance on Stressed Syllables.**
        *   **Priority 6: General Assonance/Consonance.**
    *   **Goal for Non-Overlapping Output:** The `segments` array in your final `phonetic_segment_groups` JSON should ideally not contain multiple segment objects whose `globalStartIndex` and `globalEndIndex` would result in highlighting the same character(s) with different `phonetic_link_id`s. **Prioritize rigorously to ensure that for any given character span, only the segment from the highest-priority identified pattern is reported.** If multiple patterns of the *same highest priority* cover a span, choose the one that best represents the most significant or distinctive phonetic link for that span.

8.  **Accuracy of Indices AND Segment Text (REITERATED):**
    *   It is ABSOLUTELY CRITICAL that all indices are precise.
    *   The `text` field of each segment MUST be the literal substring extracted using these exact indices. **Before outputting, mentally verify: does `input_text[globalStartIndex:globalEndIndex]` exactly equal this segment's `text` value?**

Review your identified segment groups after applying prioritization. Maximize justifiable granularity for the primary highlights. Your output must be a single JSON object adhering to the `OUTPUT_JSON_STRUCTURE_DESCRIPTION`.
"""

    MAX_CHARS_PER_CHUNK_RHYME = 3500 
    CHUNK_OVERLAP_CHARS_RHYME = 150  

    def get_rhyme_analysis_from_claude(text_to_analyze, rhyme_scheme_key):
        start_time = time.time()
        selected_system_prompt = CLAUDE_SYSTEM_PROMPTS.get(rhyme_scheme_key, CLAUDE_SYSTEM_PROMPTS["phonetic_architecture"])
        processed_segment_groups = [] 
        original_text_length = len(text_to_analyze)

        if original_text_length == 0: return []

        chunk_starts = []
        current_pos = 0
        while current_pos < original_text_length:
            chunk_starts.append(current_pos)
            next_increment = MAX_CHARS_PER_CHUNK_RHYME - CHUNK_OVERLAP_CHARS_RHYME
            if next_increment <= 0: 
                next_increment = MAX_CHARS_PER_CHUNK_RHYME // 2 if MAX_CHARS_PER_CHUNK_RHYME > 0 else 1
            next_pos_candidate = current_pos + next_increment
            if next_pos_candidate <= current_pos and original_text_length > MAX_CHARS_PER_CHUNK_RHYME:
                current_pos += 1 
            else:
                current_pos = next_pos_candidate
        if not chunk_starts: chunk_starts.append(0)

        for chunk_idx, chunk_start_offset in enumerate(chunk_starts):
            chunk_end_offset = min(chunk_start_offset + MAX_CHARS_PER_CHUNK_RHYME, original_text_length)
            current_chunk_text = text_to_analyze[chunk_start_offset:chunk_end_offset]
            if not current_chunk_text.strip(): continue

            user_prompt_body_template = f"""The text provided is a segment of a larger piece. Identify phonetic patterns *within this segment*.
Ignore any structural markers. Focus only on the lyrical content.
Ignore contributor notes or annotations.

Text segment to analyze:
---
{current_chunk_text}
---
Your entire response MUST be ONLY a single JSON object, conforming to the structure described below.
{OUTPUT_JSON_STRUCTURE_DESCRIPTION}
For 'phonetic_architecture', ensure segment-level analysis, accurate literal 'text' fields for segments, intra-word segmentation, AND highlighting prioritization as detailed in system instructions.
"""
            if rhyme_scheme_key == "phonetic_architecture":
                user_prompt_content = f"{PHONETIC_ARCHITECTURE_USER_PROMPT_CRITICAL_DIRECTIVES}\n\n{user_prompt_body_template}"
            else: 
                user_prompt_content = f"""Analyze the following text segment for the rhyme scheme: '{rhyme_scheme_key}'.
The text segment is:\n---\n{current_chunk_text}\n---\nInstructions:\n- Identify rhyme patterns strictly according to the '{rhyme_scheme_key}' definition.\n- Your response MUST be ONLY a single JSON object with a top-level key "rhyme_groups", containing an array of objects, each with "words" (array of strings) and "pattern_description" (string).
Example for couplets_aa_bb: {{ "rhyme_groups": [ {{ "words": ["day", "play"], "pattern_description": "Rhyming Couplet (AA): End words of two consecutive lines share a similar sound." }} ] }}"""
            
            print(f"--- PROMPT FOR CHUNK {chunk_idx+1} ({rhyme_scheme_key}) ---")
            
            try:
                message = client.messages.create(
                    model=CLAUDE_MODEL_NAME,
                    system=selected_system_prompt,
                    messages=[{"role": "user", "content": user_prompt_content}],
                    **CLAUDE_MODEL_PARAMS
                )
                raw_response_text = message.content[0].text if message.content else ""
                json_str = None
                if raw_response_text.strip().startswith("{") and raw_response_text.strip().endswith("}"):
                     json_str = raw_response_text.strip()
                else:
                    json_match = re.search(r"```json\\s*([\\s\\S]*?)\\s*```|({[\\s\\S]*})", raw_response_text)
                    if json_match: json_str = json_match.group(1) or json_match.group(2)
                
                claude_output_chunk = None
                if json_str:
                    try: claude_output_chunk = json.loads(json_str)
                    except json.JSONDecodeError as de: print(f"Warning: JSONDecodeError chunk {chunk_idx+1}. Snippet: {raw_response_text[:200]}... Error: {de}")
                else: print(f"Warning: No JSON block chunk {chunk_idx+1}. Snippet: {raw_response_text[:200]}...")

                if claude_output_chunk:
                    if rhyme_scheme_key == "phonetic_architecture":
                        if 'phonetic_segment_groups' in claude_output_chunk and isinstance(claude_output_chunk['phonetic_segment_groups'], list):
                            for group_data_from_ai in claude_output_chunk['phonetic_segment_groups']:
                                if isinstance(group_data_from_ai, dict) and \
                                   all(k in group_data_from_ai for k in ['phonetic_link_id', 'pattern_description', 'segments']) and \
                                   isinstance(group_data_from_ai['segments'], list) and group_data_from_ai['segments']: # Segments list should not be empty
                                    
                                    valid_segments_in_this_ai_group = []
                                    for seg_from_ai in group_data_from_ai['segments']:
                                        if isinstance(seg_from_ai, dict) and \
                                           all(k_seg in seg_from_ai for k_seg in ["text", "parent_word_text", "globalStartIndex", "globalEndIndex", "startIndexInParentWord", "endIndexInParentWord"]) and \
                                           all(isinstance(seg_from_ai[k_idx], int) for k_idx in ["globalStartIndex", "globalEndIndex", "startIndexInParentWord", "endIndexInParentWord"]) and \
                                           isinstance(seg_from_ai["text"], str) and isinstance(seg_from_ai["parent_word_text"], str):
                                            # Clamp and filter indices to be within bounds
                                            gs = seg_from_ai["globalStartIndex"]
                                            ge = seg_from_ai["globalEndIndex"]
                                            # Clamp indices
                                            gs_clamped = max(0, min(gs, original_text_length - 1))
                                            ge_clamped = max(0, min(ge, original_text_length))
                                            # Only keep if indices are valid and non-overlapping
                                            if 0 <= gs_clamped < ge_clamped <= original_text_length:
                                                seg_from_ai["globalStartIndex"] = gs_clamped
                                                seg_from_ai["globalEndIndex"] = ge_clamped
                                                valid_segments_in_this_ai_group.append(seg_from_ai)
                                    
                                    if valid_segments_in_this_ai_group:
                                        # Try to find an existing group by phonetic_link_id to merge segments
                                        existing_group = next((g for g in processed_segment_groups if g["phonetic_link_id"] == group_data_from_ai["phonetic_link_id"]), None)
                                        if existing_group:
                                            for new_seg in valid_segments_in_this_ai_group:
                                                # Add segment if it's not already present (based on global position and parent word)
                                                is_duplicate_segment = any(
                                                    ex_seg["globalStartIndex"] == new_seg["globalStartIndex"] and \
                                                    ex_seg["globalEndIndex"] == new_seg["globalEndIndex"] and \
                                                    ex_seg["parent_word_text"] == new_seg["parent_word_text"]
                                                    for ex_seg in existing_group["segments"]
                                                )
                                                if not is_duplicate_segment:
                                                    existing_group["segments"].append(new_seg)
                                        else: # If phonetic_link_id is new, add this as a new group
                                            processed_segment_groups.append({
                                                "phonetic_link_id": group_data_from_ai["phonetic_link_id"],
                                                "pattern_description": group_data_from_ai["pattern_description"],
                                                "segments": valid_segments_in_this_ai_group
                                            })
                                else: 
                                    print(f"Warning: Invalid phonetic_segment_group item structure from AI: {group_data_from_ai}")
                        else: 
                            print(f"Warning: 'phonetic_segment_groups' key missing or not a list in phonetic_architecture chunk {chunk_idx+1} response.")
                    
                    elif 'rhyme_groups' in claude_output_chunk and isinstance(claude_output_chunk['rhyme_groups'], list): # Basic handling for other schemes (word-based)
                        # This structure is for simpler rhyme schemes, not phonetic_segment_groups
                        # To avoid mixing data types directly in processed_segment_groups if it's meant for phonetic_architecture,
                        # we might return this differently or expect the route handler to manage it.
                        # For now, if a different scheme is chosen, this will be returned as is.
                        if not any(item.get("type") == rhyme_scheme_key and item.get("data") == claude_output_chunk['rhyme_groups'] for item in processed_segment_groups):
                             processed_segment_groups.append({"type": rhyme_scheme_key, "data": claude_output_chunk['rhyme_groups']})
                
            except anthropic.APIError as e:
                print(f"Anthropic API Error processing chunk {chunk_idx+1} for {rhyme_scheme_key}: {e}")
                user_message = "Our analysis engine seems to be quite busy or encountered a hiccup."
                if isinstance(e, anthropic.RateLimitError): user_message = "Wow, you're analyzing so much! We've hit a temporary limit. Please try again in a moment."
                elif isinstance(e, anthropic.AuthenticationError): user_message = "Authentication issue with our analysis engine. Please contact support."
                return [{"error_message": f"{user_message} (Details: {str(e)})"}]
            except Exception as e:
                print(f"Error processing chunk {chunk_idx+1} for {rhyme_scheme_key} with Claude: {e}")
                import traceback
                traceback.print_exc()
                return [{"error_message": f"An unexpected problem occurred while analyzing your text. (Details: {str(e)})"}]

        # Record metrics for patterns and segments
        for group in processed_segment_groups:
            if 'phonetic_link_id' in group:
                PATTERN_COUNTS.labels(pattern_type=group['phonetic_link_id']).inc()
                if 'segments' in group:
                    SEGMENT_COUNTS.labels(segment_type=group['phonetic_link_id']).inc(len(group['segments']))
                    # Record pattern length distribution
                    for segment in group['segments']:
                        pattern_length = segment['globalEndIndex'] - segment['globalStartIndex']
                        PATTERN_DISTRIBUTION.observe(pattern_length)
        
        # Update performance metrics
        end_time = time.time()
        performance_monitor.record_response_time((end_time - start_time) * 1000)
        performance_monitor.record_pattern_count(len(processed_segment_groups))
        performance_monitor.record_segment_count(sum(len(g.get('segments', [])) for g in processed_segment_groups))
        
        return processed_segment_groups

    def generate_cache_key(text: str, rhyme_scheme: str) -> str:
        """Generate a deterministic cache key for the analysis."""
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        return f"{rhyme_scheme}_{text_hash}"

    # --- Flask Routes ---
    @app.route('/api/analyze', methods=['POST'])
    @limiter.limit("10 per minute")
    @monitor_request
    def analyze_text_route():
        try:
            # Get and validate request data
            data = request.get_json()
            if not data or 'text' not in data:
                logger.error("Missing 'text' in request data")
                raise ValueError("Missing required field: text")

            text_to_analyze = validate_text_input(data['text'])
            rhyme_scheme_key = data.get('rhyme_scheme', 'phonetic_architecture')

            # Record text length metric
            ANALYSIS_CHARACTERS.observe(len(text_to_analyze))

            # Log the request
            logger.info("Analysis request received", extra={
                "text_length": len(text_to_analyze),
                "rhyme_scheme": rhyme_scheme_key
            })

            # Try memory-efficient cache first
            cache_key = generate_cache_key(text_to_analyze, rhyme_scheme_key)
            cached_result = memory_cache.get(cache_key)
            if cached_result:
                logger.info("Cache hit for analysis request")
                CACHE_HITS.inc()
                return jsonify(cached_result)
            
            CACHE_MISSES.inc()

            # Perform analysis
            try:
                result = get_rhyme_analysis_from_claude(text_to_analyze, rhyme_scheme_key)
                
                # Cache the result
                memory_cache.set(cache_key, result)
                
                logger.info("Analysis completed successfully", extra={
                    "result_size": len(str(result)),
                    "cache_timeout": 0
                })
                
                return jsonify(result)
                
            except anthropic.APIError as e:
                logger.error("Anthropic API error", extra={
                    "error": str(e),
                    "status_code": getattr(e, 'status_code', None)
                })
                return jsonify({
                    "error": "AI service error",
                    "message": "Failed to analyze text"
                }), 503
                
        except ValueError as e:
            logger.error("Validation error", extra={"error": str(e)})
            return jsonify({
                "error": "Validation error",
                "message": str(e)
            }), 400
            
        except Exception as e:
            logger.error("Unexpected error in analysis", exc_info=True)
            return jsonify({
                "error": "Internal server error",
                "message": "An unexpected error occurred"
            }), 500

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    # Add performance stats endpoint
    if __name__ == '__main__':
        app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))

except Exception as e:
    import traceback
    print("=== Exception during startup ===")
    traceback.print_exc()
    raise
