import { logger } from '../utils/logger';
import { admin, db, auth } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

interface LegacyAnalysis {
  id: string;
  userId: string;
  text: string;
  patterns: any[];
  constellations: any[];
  timestamp: Date;
  metadata: any;
}

async function migrateAnalysesToFirestore() {
  try {
    logger.info('Starting migration of analyses to Firestore...');
    
    // This would be where you fetch your legacy data
    // For example, from a JSON file or legacy database
    const legacyAnalyses: LegacyAnalysis[] = [
      // Add your legacy data here or fetch from your source
    ];

    const batch = db.batch();
    let count = 0;

    for (const analysis of legacyAnalyses) {
      const docRef = db.collection('observations').doc();
      
      const observationData = {
        text: analysis.text,
        language: 'en', // default language
        userId: analysis.userId,
        patterns: analysis.patterns || [],
        constellations: analysis.constellations || [],
        createdAt: Timestamp.fromDate(
          analysis.timestamp instanceof Date ? analysis.timestamp : new Date(analysis.timestamp)
        ),
        metadata: {
          ...analysis.metadata,
          updatedAt: Timestamp.fromDate(
            analysis.timestamp instanceof Date ? analysis.timestamp : new Date(analysis.timestamp)
          ),
          rhymeScheme: null,
          meter: null,
          modelUsed: 'legacy-import',
          analysisOptions: {}
        }
      };

      batch.set(docRef, observationData);
      count++;

      // Commit batch every 500 operations (Firestore limit)
      if (count % 500 === 0) {
        await batch.commit();
        logger.info(`Migrated ${count} analyses so far...`);
      }
    }

    // Commit any remaining operations
    if (count % 500 !== 0) {
      await batch.commit();
    }

    logger.info(`Successfully migrated ${count} analyses to Firestore`);
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateAnalysesToFirestore()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateAnalysesToFirestore }; 