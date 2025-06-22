import { db } from '../config/firebase';
import { logger } from '../utils/logger';

interface BatchItem {
  id: string;
  type: string;
  data: any;
}

interface BatchJob {
  id: string;
  userId: string;
  items: BatchItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

class BatchService {
  private batchRef = db.collection('batches');

  async submitBatch(items: BatchItem[], userId: string): Promise<BatchJob> {
    try {
      const batch: Omit<BatchJob, 'id'> = {
        userId,
        items,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await this.batchRef.add(batch);
      
      // Start processing the batch asynchronously
      this.processBatch(docRef.id).catch(error => {
        logger.error('Error processing batch:', error);
      });

      return { ...batch
      , id: docRef.id } as BatchJob;
    } catch (error) {
      logger.error('Error submitting batch:', error);
      throw error;
    }
  }

  async getBatchStatus(batchId: string, userId: string): Promise<BatchJob | null> {
    try {
      const doc = await this.batchRef.doc(batchId).get();
      if (!doc.exists) return null;

      const batch = doc.data() as BatchJob;
      if (batch.userId !== userId) {
        throw new Error('Unauthorized access to batch');
      }

      return { ...batch
      , id: doc.id };
    } catch (error) {
      logger.error('Error getting batch status:', error);
      throw error;
    }
  }

  async cancelBatch(batchId: string, userId: string): Promise<void> {
    try {
      const doc = await this.batchRef.doc(batchId).get();
      if (!doc.exists) throw new Error('Batch not found');

      const batch = doc.data() as BatchJob;
      if (batch.userId !== userId) {
        throw new Error('Unauthorized access to batch');
      }

      if (['completed', 'failed'].includes(batch.status)) {
        throw new Error('Cannot cancel completed or failed batch');
      }

      await this.batchRef.doc(batchId).update({
        status: 'cancelled',
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error('Error cancelling batch:', error);
      throw error;
    }
  }

  private async processBatch(batchId: string): Promise<void> {
    const docRef = this.batchRef.doc(batchId);

    try {
      await docRef.update({
        status: 'processing',
        updatedAt: new Date()
      });

      const doc = await docRef.get();
      const batch = doc.data() as BatchJob;

      const results: any[] = [];
      let progress = 0;

      for (const item of batch.items) {
        if (batch.status === 'cancelled') break;

        try {
          // Process each item based on its type
          const result = await this.processItem(item);
          results.push(result);
        } catch (error) {
          logger.error(`Error processing batch item ${item.id}:`, error);
          results.push({ error: (error as Error).message });
        }

        progress = ((results.length / batch.items.length) * 100);
        await docRef.update({
          progress,
          updatedAt: new Date()
        });
      }

      await docRef.update({
        status: batch.status === 'cancelled' ? 'cancelled' : 'completed',
        progress: batch.status === 'cancelled' ? progress : 100,
        result: results,
        completedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error('Error in batch processing:', error);
      await docRef.update({
        status: 'failed',
        error: (error as Error).message,
        updatedAt: new Date()
      });
    }
  }

  private async processItem(item: BatchItem): Promise<any> {
    // Implement item processing based on type
    switch (item.type) {
      case 'observation':
        // Process observation
        return { status: 'processed', data: item.data };
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }
  }
}

export const batchService = new BatchService(); 