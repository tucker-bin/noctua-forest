import { db } from '../config/firebase';
import { Lesson, LearningPath } from '../types/lesson.types';
import { logger } from '../utils/logger';

const sampleLessons: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    path: 'celestial-observer',
    slug: 'first-light',
    title: 'First Light: Introduction to Observation',
    description: 'Introduction to sound observation and basic pattern recognition',
    order: 1,
    duration: '20 min',
    difficulty: 'beginner',
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Welcome to Pattern Observation',
          content: 'In this first lesson, we\'ll develop basic observation skills for recognizing sound patterns in language. Like learning to spot subtle details in any new field, this takes practice and patience.',
        },
        {
          type: 'practice',
          title: 'Basic Pattern Recognition',
          content: 'Let\'s begin with a familiar text that contains clear patterns:',
          examples: [
            {
              text: 'Twinkle, twinkle, little star,\nHow I wonder what you are.',
              explanation: 'Notice the repeated sounds and natural rhythm'
            }
          ]
        },
        {
          type: 'exercise',
          title: 'Pattern Practice',
          content: 'Try to identify patterns in the following text:',
          exercises: [
            {
              question: 'Which words in "The silver stream slips slowly by" share similar starting sounds?',
              options: ['silver, stream, slips, slowly', 'the, silver', 'stream, by', 'slips, by'],
              correctAnswer: 'silver, stream, slips, slowly',
              hint: 'Look for words that start with the same sound'
            }
          ]
        }
      ]
    },
    requirements: [],
    nextLesson: 'star-patterns'
  },
  {
    path: 'celestial-observer',
    slug: 'star-patterns',
    title: 'Star Patterns: Universal Sounds',
    description: 'Explore universal patterns that appear across languages',
    order: 2,
    duration: '25 min',
    difficulty: 'beginner',
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Universal Sound Patterns',
          content: 'Some sound patterns appear in many languages and cultures. These are like the brightest stars - easy to spot once you know what to look for.',
        },
        {
          type: 'examples',
          title: 'Cross-Language Patterns',
          content: 'Here are examples of similar patterns in different languages:',
          examples: [
            {
              text: 'English: "Peter Piper picked"\nSpanish: "Tres tristes tigres"',
              explanation: 'Both use repeated consonant sounds at the beginning of words'
            }
          ]
        },
        {
          type: 'exercise',
          title: 'Universal Pattern Recognition',
          content: 'Identify the pattern type in these examples:',
          exercises: [
            {
              question: 'What type of pattern is shown in "Round and round the rugged rock"?',
              options: ['Rhyme', 'Alliteration', 'Rhythm', 'Assonance'],
              correctAnswer: 'Alliteration',
              hint: 'Focus on the beginning sounds of the words'
            }
          ]
        }
      ]
    },
    requirements: ['first-light'],
    nextLesson: 'constellation-mapping'
  },
  {
    path: 'pattern-navigator',
    slug: 'advanced-mapping',
    title: 'Advanced Pattern Mapping',
    description: 'Master complex pattern relationships and networks',
    order: 1,
    duration: '40 min',
    difficulty: 'advanced',
    content: {
      sections: [
        {
          type: 'welcome',
          title: 'Complex Pattern Networks',
          content: 'Advanced pattern recognition involves understanding how different patterns interact and create complex networks of sound relationships.',
        },
        {
          type: 'practice',
          title: 'Multi-layered Analysis',
          content: 'Learn to identify multiple overlapping patterns in the same text.',
          examples: [
            {
              text: 'In the deep dark woods where the wild wind wails',
              explanation: 'This contains alliteration (w sounds), assonance (ee sounds), and rhythm patterns'
            }
          ]
        }
      ]
    },
    requirements: ['star-patterns', 'constellation-mapping']
  }
];

const seedLessons = async () => {
  try {
    console.log('Starting lesson seeding...');
    
    const lessonsRef = db.collection('lessons');
    
    for (const lessonData of sampleLessons) {
      const lesson: Omit<Lesson, 'id'> = {
        ...lessonData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Check if lesson already exists
      const existingSnapshot = await lessonsRef
        .where('path', '==', lesson.path)
        .where('slug', '==', lesson.slug)
        .get();
      
      if (existingSnapshot.empty) {
        await lessonsRef.add(lesson);
        console.log(`Added lesson: ${lesson.title}`);
      } else {
        console.log(`Lesson already exists: ${lesson.title}`);
      }
    }
    
    console.log('Lesson seeding completed!');
  } catch (error) {
    console.error('Error seeding lessons:', error);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedLessons().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

export { seedLessons }; 