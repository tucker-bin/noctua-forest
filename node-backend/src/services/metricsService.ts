import { db } from '../config/firebase';
import { logger } from '../utils/logger';

interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

class MetricsService {
  private metricsRef = db.collection('metrics');

  async getCounter(name: string, labels?: Record<string, string>): Promise<number> {
    try {
      const snapshot = await this.metricsRef
        .where('name', '==', name)
        .where('type', '==', 'counter')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return 0;

      const metric = snapshot.docs[0].data() as MetricValue;
      return metric.value;
    } catch (error) {
      logger.error('Error getting counter:', error);
      return 0;
    }
  }

  async incrementCounter(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.metricsRef.add({
        name,
        type: 'counter',
        value,
        labels,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error incrementing counter:', error);
    }
  }

  async getGauge(name: string, labels?: Record<string, string>): Promise<number> {
    try {
      const snapshot = await this.metricsRef
        .where('name', '==', name)
        .where('type', '==', 'gauge')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return 0;

      const metric = snapshot.docs[0].data() as MetricValue;
      return metric.value;
    } catch (error) {
      logger.error('Error getting gauge:', error);
      return 0;
    }
  }

  async setGauge(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    try {
      await this.metricsRef.add({
        name,
        type: 'gauge',
        value,
        labels,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error setting gauge:', error);
    }
  }

  async recordTiming(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    try {
      await this.metricsRef.add({
        name,
        type: 'timing',
        value,
        labels,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error recording timing:', error);
    }
  }

  async getAverageTiming(name: string, labels?: Record<string, string>): Promise<number> {
    try {
      const snapshot = await this.metricsRef
        .where('name', '==', name)
        .where('type', '==', 'timing')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      if (snapshot.empty) return 0;

      const timings = snapshot.docs.map(doc => (doc.data() as MetricValue).value);
      return timings.reduce((a, b) => a + b, 0) / timings.length;
    } catch (error) {
      logger.error('Error getting average timing:', error);
      return 0;
    }
  }

  async getTimingPercentile(name: string, percentile: number): Promise<number> {
    try {
      const snapshot = await this.metricsRef
        .where('name', '==', name)
        .where('type', '==', 'timing')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      if (snapshot.empty) return 0;

      const timings = snapshot.docs
        .map(doc => (doc.data() as MetricValue).value)
        .sort((a, b) => a - b);

      const index = Math.ceil((percentile / 100) * timings.length) - 1;
      return timings[index];
    } catch (error) {
      logger.error('Error getting timing percentile:', error);
      return 0;
    }
  }
}

export const metricsService = new MetricsService(); 