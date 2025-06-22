import { observationService } from './observationService';
import { trackBatchOperation } from '../middleware/monitoring';
import { logger } from '../utils/logger';

interface BatchItem {
  id: string;
  text: string;
  language?: string;
}

interface BatchResult {
  id: string;
  result: any;
  error?: string;
}

export async function processBatch(items: BatchItem[], userId: string): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  try {
    trackBatchOperation('submitted');

    for (const item of items) {
      try {
        const observation = await observationService.observeText(
          item.text,
          userId,
          item.language || 'en'
        );

        results.push({
          id: item.id,
          result: observation
        });
      } catch (error) {
        logger.error(`Error processing batch item ${item.id}:`, error);
        results.push({
          id: item.id,
          result: null,
          error: (error as Error).message
        });
      }
    }

    trackBatchOperation('completed');
    return results;
  } catch (error) {
    trackBatchOperation('failed');
    throw error;
  }
} 