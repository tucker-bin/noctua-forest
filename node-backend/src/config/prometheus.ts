import client from 'prom-client';

// Metrics and Prometheus setup
export const requestCount = new client.Counter({
  name: 'rhyme_analysis_requests_total',
  help: 'Total number of rhyme analysis requests',
  labelNames: ['method', 'endpoint', 'status'],
});
export const requestLatency = new client.Histogram({
  name: 'rhyme_analysis_request_latency_seconds',
  help: 'Request latency in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});
export const analysisCharacters = new client.Histogram({
  name: 'rhyme_analysis_characters',
  help: 'Number of characters analyzed',
  buckets: [100, 500, 1000, 2000, 5000, 10000]
});
export const cacheHits = new client.Counter({
  name: 'rhyme_analysis_cache_hits_total',
  help: 'Total number of cache hits'
});
export const cacheMisses = new client.Counter({
  name: 'rhyme_analysis_cache_misses_total',
  help: 'Total number of cache misses'
});
export const patternCounts = new client.Counter({
  name: 'rhyme_analysis_patterns_total',
  help: 'Number of patterns found by type',
  labelNames: ['pattern_type']
});
export const segmentCounts = new client.Counter({
  name: 'rhyme_analysis_segments_total',
  help: 'Number of segments found by type',
  labelNames: ['segment_type']
});
export const avgPatternLength = new client.Gauge({
  name: 'rhyme_analysis_avg_pattern_length',
  help: 'Average length of patterns found'
});
export const patternDistribution = new client.Histogram({
  name: 'rhyme_analysis_pattern_distribution',
  help: 'Distribution of pattern lengths',
  buckets: [10, 20, 50, 100, 200, 500]
});

export const promClient = client;

promClient.collectDefaultMetrics(); 