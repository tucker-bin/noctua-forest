interface PronunciationGuide {
  ipa: string;
  romanization?: string;
  nativeScript: string;
  explanation: Record<string, string>;
  soundFeatures: {
    stress?: string[];
    tone?: string[];
    length?: string[];
    special?: string[];
  };
  learnerTips?: {
    tip: string;
    practice: string;
    emoji: string;
  }[];
  relatable?: {
    popCulture?: string;
    social?: string;
  };
}

interface LanguagePhonology {
  name: string;
  features: string[];
  commonPatterns: string[];
  stressRules?: string[];
  toneRules?: string[];
  specialRules?: string[];
}

const phonologyMap: Record<string, LanguagePhonology> = {
  ja: {
    name: 'Japanese',
    features: ['pitch accent', 'mora timing', 'vowel devoicing'],
    commonPatterns: ['CV syllables', 'geminate consonants', 'long vowels'],
    specialRules: ['no consonant clusters', 'pitch accent on specific moras']
  },
  zh: {
    name: 'Chinese',
    features: ['tones', 'syllable structure', 'tone sandhi'],
    commonPatterns: ['CVVX syllables', 'tone combinations', 'neutral tone'],
    toneRules: ['four tones in Mandarin', 'tone sandhi rules']
  },
  ar: {
    name: 'Arabic',
    features: ['pharyngealization', 'vowel length', 'consonant emphasis'],
    commonPatterns: ['trilateral roots', 'vowel patterns', 'gemination'],
    stressRules: ['heavy syllables attract stress', 'final syllable restrictions']
  },
  ko: {
    name: 'Korean',
    features: ['vowel harmony', 'consonant tensification', 'pitch patterns'],
    commonPatterns: ['CV(C) syllables', 'consonant assimilation', 'vowel length'],
    specialRules: ['liaison', 'consonant neutralization']
  },
  vi: {
    name: 'Vietnamese',
    features: ['tones', 'monophthongs', 'diphthongs', 'final consonants'],
    commonPatterns: ['CV syllables', 'tone sandhi', 'vowel length'],
    toneRules: ['six tones', 'tone changes in compounds'],
    specialRules: ['no consonant clusters', 'restricted finals']
  }
};

// Add teen-friendly explanations
interface LearnerProfile {
  level: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  commonChallenges: string[];
  examples: {
    pop: string[];
    social: string[];
    school: string[];
  };
}

const learnerProfiles: Record<string, Record<string, LearnerProfile>> = {
  vi: {
    en: {
      level: 'intermediate',
      interests: ['K-pop', 'social media', 'fashion', 'school life'],
      commonChallenges: [
        'th sound',
        'final consonants',
        'stress patterns',
        'reduced vowels'
      ],
      examples: {
        pop: ['How you like that → "How-yu-like-dat"', 'Love sick → "Lop-sick"'],
        social: ['trending → "tren-ding"', 'literally → "li-te-ra-ly"'],
        school: ['mathematics → "math-uh-mat-ics"', 'biology → "bi-o-lo-gy"']
      }
    }
  }
};

// Add fun explanations for sound differences
interface SoundExplanation {
  challenge: string;
  funExplanation: string;
  practicePhrase: string;
  emoji: string;
}

const soundExplanations: Record<string, Record<string, SoundExplanation[]>> = {
  vi: {
    en: [
      {
        challenge: 'th',
        funExplanation: `Stick your tongue out like you're taking a selfie! That's how you make the "th" sound 🤳`,
        practicePhrase: 'Think about three things',
        emoji: '😋'
      },
      {
        challenge: 'r/l',
        funExplanation: `Curl your tongue back like you're making a tiny ice cream cone 🍦`,
        practicePhrase: 'Really love red roses',
        emoji: '🌹'
      },
      {
        challenge: 'final consonants',
        funExplanation: `Don't let the sound escape! Close your lips like you're keeping a secret 🤫`,
        practicePhrase: 'Stop, hop, pop',
        emoji: '🎵'
      }
    ]
  }
};

// Enhance the pronunciation guide with learner-specific features
export async function getPronunciationGuide(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  userAge?: 'child' | 'teen' | 'adult',
  interests?: string[]
): Promise<PronunciationGuide[]> {
  const segments = text.split(/\s+/);
  const profile = learnerProfiles[sourceLanguage]?.[targetLanguage];
  const explanations = soundExplanations[sourceLanguage]?.[targetLanguage] || [];
  
  return segments.map(segment => {
    const guide: PronunciationGuide = {
      ipa: '[placeholder IPA]',
      romanization: sourceLanguage !== 'en' ? 'romanized text' : undefined,
      nativeScript: segment,
      explanation: {
        [targetLanguage]: `Explanation of pronunciation in ${targetLanguage}`,
        en: 'English explanation of pronunciation'
      },
      soundFeatures: {
        stress: ['primary', 'secondary'],
        tone: sourceLanguage === 'vi' ? ['high', 'rising', 'falling'] : undefined,
        length: ['short', 'long'],
        special: phonologyMap[sourceLanguage]?.specialRules
      }
    };

    // Add teen-friendly explanations if applicable
    if (userAge === 'teen' && profile) {
      const relevantChallenges = explanations.filter(exp => 
        segment.toLowerCase().includes(exp.challenge)
      );

      if (relevantChallenges.length > 0) {
        guide.learnerTips = relevantChallenges.map(challenge => ({
          tip: challenge.funExplanation,
          practice: challenge.practicePhrase,
          emoji: challenge.emoji
        }));
      }

      // Add relatable examples
      guide.relatable = {
        popCulture: profile.examples.pop.find(ex => 
          ex.toLowerCase().includes(segment.toLowerCase())
        ),
        social: profile.examples.social.find(ex =>
          ex.toLowerCase().includes(segment.toLowerCase())
        )
      };
    }

    return guide;
  });
}

export function getPhonologyComparison(
  sourceLanguage: string,
  targetLanguage: string
): { similarities: string[]; differences: string[] } {
  const source = phonologyMap[sourceLanguage];
  const target = phonologyMap[targetLanguage];
  
  if (!source || !target) {
    return {
      similarities: [],
      differences: []
    };
  }

  const similarities = source.features.filter(f => target.features.includes(f));
  const differences = [
    ...source.features.filter(f => !target.features.includes(f)),
    ...target.features.filter(f => !source.features.includes(f))
  ];

  return {
    similarities,
    differences
  };
}

export function getSoundCorrespondences(
  sourceLanguage: string,
  targetLanguage: string
): { source: string; target: string; example: string }[] {
  // This would be expanded with a comprehensive database of sound correspondences
  return [
    {
      source: 'Example sound in source language',
      target: 'Corresponding sound in target language',
      example: 'Example word pair'
    }
  ];
} 