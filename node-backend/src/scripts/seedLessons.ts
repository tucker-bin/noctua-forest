import { db } from '../config/firebase';
import { Lesson } from '../types/lesson.types';
import { logger } from '../utils/logger';

const lessons: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    path: 'explorer',
    slug: 'first-patterns',
    title: 'First Patterns',
    description: 'Introduction to basic patterns in text',
    order: 1,
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Welcome to Pattern Explorer',
          content: 'In this lesson, you will learn to identify basic patterns in text. Just like stars in the night sky form constellations, words can form patterns that help us understand language better.'
        },
        {
          type: 'examples',
          title: 'Pattern Examples',
          content: 'Let\'s look at some simple patterns:',
          examples: [
            {
              text: 'cat - hat - mat',
              explanation: 'Words that rhyme follow a pattern'
            },
            {
              text: 'run - ran - running',
              explanation: 'Words can change in predictable ways'
            }
          ]
        },
        {
          type: 'exercise',
          title: 'Pattern Practice',
          content: 'Try identifying the pattern:',
          exercises: [
            {
              question: 'Which word follows the pattern: sing, ring, ___?',
              options: ['bring', 'song', 'dance', 'music'],
              correctAnswer: 'bring',
              hint: 'Look for words that rhyme with "sing"'
            }
          ]
        }
      ]
    }
  },
  {
    path: 'explorer',
    slug: 'sound-pairs',
    title: 'Sound Pairs',
    description: 'Discover words that naturally go together',
    order: 2,
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Welcome to Sound Pairs',
          content: 'Just as stars often appear in pairs, words can have natural partners too. In this lesson, we\'ll explore words that work together.'
        },
        {
          type: 'examples',
          title: 'Word Pair Examples',
          content: 'Here are some common word pairs:',
          examples: [
            {
              text: 'day and night',
              explanation: 'Opposites that often appear together'
            },
            {
              text: 'salt and pepper',
              explanation: 'Common pairs in everyday life'
            }
          ]
        },
        {
          type: 'exercise',
          title: 'Pair Practice',
          content: 'Complete the pair:',
          exercises: [
            {
              question: 'What goes with "thunder"?',
              options: ['rain', 'lightning', 'wind', 'cloud'],
              correctAnswer: 'lightning',
              hint: 'Think about what usually comes with thunder in nature'
            }
          ]
        }
      ]
    }
  },
  {
    path: 'navigator',
    slug: 'advanced-patterns',
    title: 'Advanced Pattern Recognition',
    description: 'Explore complex patterns in language',
    order: 1,
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Welcome to Advanced Patterns',
          content: 'Like complex constellations, language can form intricate patterns. We\'ll explore these deeper connections.'
        },
        {
          type: 'examples',
          title: 'Complex Pattern Examples',
          content: 'Observe these pattern sequences:',
          examples: [
            {
              text: 'walk - walked - walking - walks',
              explanation: 'Verb conjugation patterns'
            },
            {
              text: 'happy - happier - happiest',
              explanation: 'Comparative and superlative patterns'
            }
          ]
        },
        {
          type: 'exercise',
          title: 'Pattern Analysis',
          content: 'Identify the pattern rule:',
          exercises: [
            {
              question: 'What\'s the pattern: teach, taught, catch, ___?',
              options: ['caught', 'teached', 'teaching', 'catches'],
              correctAnswer: 'caught',
              hint: 'Look at how the first pair of words changes'
            }
          ]
        }
      ]
    }
  }
];

const seedLessons = async () => {
  try {
    const lessonsRef = db.collection('lessons');
    const batch = db.batch();

    // Delete existing lessons
    const snapshot = await lessonsRef.get();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new lessons
    lessons.forEach(lesson => {
      const docRef = lessonsRef.doc();
      batch.set(docRef, {
        ...lesson,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();
    logger.info('Successfully seeded lessons');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding lessons:', error);
    process.exit(1);
  }
};

seedLessons(); 