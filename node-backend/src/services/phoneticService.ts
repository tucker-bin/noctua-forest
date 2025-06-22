import { cmudict } from '../data/cmudict';
import { LanguageConfig, PhoneticSystem } from '../types/phonetics';

interface PhoneticWord {
  word: string;
  phonemes: string[];
  stress: number[];
}

// CMU Dictionary format conversion
function parseCMUEntry(entry: string): PhoneticWord {
  const [word, ...phonemes] = entry.split('  ');
  const phoneticData = phonemes[0].split(' ');
  
  return {
    word: word.toLowerCase(),
    phonemes: phoneticData.map(p => p.replace(/[0-9]/g, '')),
    stress: phoneticData.map(p => parseInt(p.match(/[0-9]/)?.[0] || '0'))
  };
}

export function phoneticize(word: string): string {
  word = word.toLowerCase().trim();
  
  // Check CMU Dictionary first
  if (cmudict[word]) {
    return cmudict[word];
  }

  // If not in dictionary, use rule-based conversion
  return convertToPhonetic(word);
}

function convertToPhonetic(word: string): string {
  // Basic rule-based phonetic conversion
  let phonetic = word.toLowerCase()
    // Common digraphs
    .replace(/ch/g, 'tʃ')
    .replace(/sh/g, 'ʃ')
    .replace(/th/g, 'θ')
    .replace(/ph/g, 'f')
    // Vowel sounds
    .replace(/ee|ea/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ai|ay/g, 'eɪ')
    .replace(/ow|ou/g, 'aʊ')
    // Silent e
    .replace(/([a-z])e$/g, '$1');

  // Add stress markers (simplified)
  phonetic = addStressMarkers(phonetic);

  return phonetic;
}

function addStressMarkers(phonetic: string): string {
  // Simplified stress rules
  const syllables = phonetic.match(/[aeiouəɪʊ]/g) || [];
  if (syllables.length === 1) {
    return '1-' + phonetic;
  }
  
  // Basic stress patterns for multi-syllable words
  const stress = Array(syllables.length).fill('0');
  if (syllables.length === 2) {
    stress[0] = '1';
  } else {
    // Stress antepenultimate syllable if it exists, otherwise penultimate
    const stressPos = syllables.length >= 3 ? syllables.length - 3 : syllables.length - 2;
    stress[stressPos] = '1';
  }

  // Add stress markers
  let result = phonetic;
  syllables.forEach((syllable, i) => {
    result = result.replace(syllable, stress[i] + syllable);
  });

  return result;
}

export function extractVowelSounds(phoneticForm: string): string[] {
  // Extract vowel sounds from phonetic representation
  return (phoneticForm.match(/[aeiouəɪʊ]/g) || [])
    .map(vowel => vowel.replace(/[0-9]/g, ''));
}

export function extractConsonantSounds(phoneticForm: string): string[] {
  // Extract consonant sounds from phonetic representation
  return (phoneticForm.match(/[bcdfghjklmnpqrstvwxyzθʃtʃ]/g) || []);
}

export function findRhymes(word: string): string[] {
  const phonetic = phoneticize(word);
  const rhymeSound = getRhymeSound(phonetic);
  
  // Find words with matching rhyme sounds
  return Object.entries(cmudict)
    .filter(([_, phon]) => getRhymeSound(phon) === rhymeSound)
    .map(([w]) => w);
}

function getRhymeSound(phonetic: string): string {
  // Get the rhyming part (last stressed vowel and following sounds)
  const parts = phonetic.split('-');
  const lastPart = parts[parts.length - 1];
  const stressMatch = lastPart.match(/[12][aeiouəɪʊ].*$/);
  return stressMatch ? stressMatch[0] : lastPart;
}

export const languageConfigs: Record<string, LanguageConfig> = {
  en: {
    name: 'English',
    vowels: ['a', 'e', 'i', 'o', 'u', 'æ', 'ə', 'ɪ', 'ʊ', 'ɛ', 'ɔ', 'ʌ'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'm', 'n', 'ŋ', 'l', 'r', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h', 'w', 'j'],
    stressMarkers: ['0', '1', '2'],
    syllableStructure: 'CCVCC',
    diphthongs: ['aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ'],
    commonClusters: ['sp', 'st', 'sk', 'pl', 'pr', 'tr', 'kr', 'bl', 'br', 'dr', 'gl', 'gr']
  },
  tl: {
    name: 'Filipino',
    vowels: ['a', 'e', 'i', 'o', 'u'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'm', 'n', 'ŋ', 'l', 'r', 's', 'h', 'w', 'j'],
    stressMarkers: ['´', '`'],
    syllableStructure: 'CVC',
    diphthongs: ['aw', 'ay', 'iw', 'oy'],
    commonClusters: ['ng', 'ts', 'dy', 'sy', 'ny']
  },
  es: {
    name: 'Spanish',
    vowels: ['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'm', 'n', 'ɲ', 'l', 'r', 'ɾ', 'f', 's', 'x', 'θ', 'ʧ', 'ʝ'],
    stressMarkers: ['´'],
    syllableStructure: 'CCVCC',
    diphthongs: ['ai', 'ei', 'oi', 'au', 'eu', 'ou'],
    commonClusters: ['pl', 'pr', 'bl', 'br', 'tr', 'dr', 'kl', 'kr', 'gl', 'gr', 'fl', 'fr']
  },
  fr: {
    name: 'French',
    vowels: ['a', 'e', 'i', 'o', 'u', 'y', 'ø', 'œ', 'ə', 'ɛ', 'ɛ̃', 'œ̃', 'ɔ', 'ɔ̃', 'ɑ̃'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'm', 'n', 'ɲ', 'l', 'ʁ', 'j', 'ɥ', 'w'],
    stressMarkers: ['´', '`', '^'],
    syllableStructure: 'CCVC',
    diphthongs: [],
    commonClusters: ['pl', 'pr', 'bl', 'br', 'tr', 'dr', 'kl', 'kr', 'gl', 'gr', 'fl', 'fr']
  },
  de: {
    name: 'German',
    vowels: ['a', 'e', 'i', 'o', 'u', 'y', 'ø', 'œ', 'ə', 'ɛ', 'ɪ', 'ʊ', 'ʏ', 'ɔ'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'ç', 'x', 'h', 'm', 'n', 'ŋ', 'l', 'r', 'j'],
    stressMarkers: ['´'],
    syllableStructure: 'CCCVCCC',
    diphthongs: ['aɪ', 'aʊ', 'ɔʏ'],
    commonClusters: ['ʃt', 'ʃp', 'ʃr', 'ʃl', 'pf', 'ts', 'tr', 'dr', 'kr', 'gr']
  },
  it: {
    name: 'Italian',
    vowels: ['a', 'e', 'i', 'o', 'u', 'ɛ', 'ɔ'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ts', 'dz', 'tʃ', 'dʒ', 'm', 'n', 'ɲ', 'l', 'ʎ', 'r', 'j', 'w'],
    stressMarkers: ['´', '`'],
    syllableStructure: 'CCVC',
    diphthongs: ['ja', 'je', 'jo', 'ju', 'wa', 'we', 'wi', 'wo'],
    commonClusters: ['pr', 'tr', 'kr', 'pl', 'kl', 'br', 'dr', 'gr', 'bl', 'gl']
  },
  pt: {
    name: 'Portuguese',
    vowels: ['a', 'ɐ', 'e', 'ɛ', 'i', 'o', 'ɔ', 'u', 'ã', 'ẽ', 'ĩ', 'õ', 'ũ'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'm', 'n', 'ɲ', 'l', 'ʎ', 'ɾ', 'ʁ', 'j', 'w'],
    stressMarkers: ['´', '`', '^', '~'],
    syllableStructure: 'CCVC',
    diphthongs: ['ai', 'ei', 'oi', 'ui', 'au', 'eu', 'ou'],
    commonClusters: ['pr', 'tr', 'kr', 'pl', 'kl', 'br', 'dr', 'gr', 'bl', 'gl']
  },
  ja: {
    name: 'Japanese',
    vowels: ['a', 'i', 'u', 'e', 'o', 'aː', 'iː', 'uː', 'eː', 'oː'],
    consonants: ['k', 'g', 's', 'z', 't', 'd', 'n', 'h', 'b', 'p', 'm', 'j', 'r', 'w'],
    stressMarkers: ['˥', '˦', '˧', '˨', '˩'],
    syllableStructure: 'CV',
    diphthongs: ['ai', 'ei', 'oi', 'ui', 'au', 'ou'],
    commonClusters: ['kj', 'gj', 'sj', 'zj', 'tj', 'dj', 'nj', 'hj', 'bj', 'pj', 'mj', 'rj']
  },
  ko: {
    name: 'Korean',
    vowels: ['a', 'ʌ', 'o', 'u', 'ɯ', 'i', 'ɛ', 'e', 'ø', 'y'],
    consonants: ['p', 'pʰ', 'p͈', 't', 'tʰ', 't͈', 'k', 'kʰ', 'k͈', 's', 's͈', 'h', 'ts', 'tsʰ', 'ts͈', 'm', 'n', 'ŋ', 'l', 'w', 'j'],
    stressMarkers: [],
    syllableStructure: 'CVC',
    diphthongs: ['ja', 'jʌ', 'jo', 'ju', 'jɛ', 'je', 'wa', 'wʌ', 'we', 'wɛ', 'ɯi'],
    commonClusters: []
  },
  zh: {
    name: 'Chinese (Mandarin)',
    vowels: ['a', 'ə', 'ɤ', 'i', 'u', 'y', 'ɑ', 'ɛ', 'e', 'o'],
    consonants: ['p', 'pʰ', 't', 'tʰ', 'k', 'kʰ', 'ts', 'tsʰ', 'tʂ', 'tʂʰ', 'tɕ', 'tɕʰ', 'f', 's', 'ʂ', 'ɕ', 'x', 'm', 'n', 'l', 'ɻ'],
    stressMarkers: ['˥', '˧˥', '˨˩˦', '˥˩', '˧'],
    syllableStructure: 'CVC',
    diphthongs: ['ai', 'ei', 'ao', 'ou', 'ia', 'ie', 'ua', 'uo', 'ye'],
    commonClusters: []
  },
  ar: {
    name: 'Arabic',
    vowels: ['a', 'i', 'u', 'aː', 'iː', 'uː'],
    consonants: ['b', 't', 'tˤ', 'd', 'dˤ', 'k', 'q', 'ʔ', 'f', 'θ', 'ð', 'ðˤ', 's', 'sˤ', 'z', 'ʃ', 'χ', 'ʁ', 'ħ', 'ʕ', 'h', 'm', 'n', 'r', 'l', 'w', 'j'],
    stressMarkers: ['ˈ'],
    syllableStructure: 'CVCC',
    diphthongs: ['aj', 'aw'],
    commonClusters: []
  },
  hi: {
    name: 'Hindi',
    vowels: ['ə', 'aː', 'i', 'iː', 'u', 'uː', 'e', 'æː', 'o', 'ɔː'],
    consonants: ['p', 'b', 't', 'd', 'ʈ', 'ɖ', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʂ', 'h', 'tʃ', 'dʒ', 'm', 'n', 'ɳ', 'ŋ', 'l', 'r', 'j', 'w'],
    stressMarkers: ['ˈ'],
    syllableStructure: 'CCVC',
    diphthongs: ['əi', 'əu', 'ai', 'au'],
    commonClusters: ['pr', 'tr', 'kr', 'br', 'dr', 'gr', 'pl', 'kl', 'bl', 'gl']
  },
  ru: {
    name: 'Russian',
    vowels: ['a', 'e', 'i', 'o', 'u', 'ɨ', 'æ', 'ʲa', 'ʲe', 'ʲo', 'ʲu'],
    consonants: ['p', 'pʲ', 'b', 'bʲ', 't', 'tʲ', 'd', 'dʲ', 'k', 'kʲ', 'g', 'gʲ', 'f', 'fʲ', 'v', 'vʲ', 's', 'sʲ', 'z', 'zʲ', 'ʂ', 'ʐ', 'x', 'ts', 'tɕ', 'm', 'mʲ', 'n', 'nʲ', 'l', 'lʲ', 'r', 'rʲ', 'j'],
    stressMarkers: ['´'],
    syllableStructure: 'CCCVCCC',
    diphthongs: [],
    commonClusters: ['str', 'skr', 'spr', 'zbr', 'zgr', 'vdr', 'vgl']
  },
  tr: {
    name: 'Turkish',
    vowels: ['a', 'e', 'ɯ', 'i', 'o', 'œ', 'u', 'y'],
    consonants: ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'm', 'n', 'ɾ', 'l', 'j'],
    stressMarkers: ['´'],
    syllableStructure: 'CVC',
    diphthongs: [],
    commonClusters: ['st', 'kt', 'nt', 'rt', 'lt']
  },
  fa: {
    name: 'Persian (Farsi)',
    vowels: ['a', 'e', 'i', 'o', 'u', 'ā', 'ē', 'ī', 'ō', 'ū'],
    consonants: ['b', 'p', 't', 'd', 'k', 'g', 'q', 'ʔ', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'x', 'ɣ', 'h', 'm', 'n', 'l', 'r', 'j', 'w'],
    stressMarkers: ['ˈ'],
    syllableStructure: 'CVCC',
    diphthongs: ['ej', 'ow', 'āj', 'āw'],
    commonClusters: ['st', 'sp', 'sk', 'ʃt', 'xt', 'ft']
  },
  ur: {
    name: 'Urdu',
    vowels: ['a', 'ɪ', 'ʊ', 'e', 'o', 'ɛ', 'ɔ', 'æ', 'ɑ', 'i', 'u'],
    consonants: ['b', 'p', 'pʰ', 't̪', 'd̪', 't̪ʰ', 'd̪ʰ', 'ʈ', 'ɖ', 'ʈʰ', 'ɖʰ', 'k', 'g', 'kʰ', 'gʰ', 'q', 'f', 's', 'z', 'ʃ', 'x', 'ɣ', 'h', 'm', 'n', 'ɳ', 'ŋ', 'l', 'r', 'ɽ', 'j', 'w'],
    stressMarkers: ['ˈ'],
    syllableStructure: 'CVCC',
    diphthongs: ['aɪ', 'aʊ', 'oɪ'],
    commonClusters: ['st', 'sk', 'sp', 'ʃt', 'kt', 'pt']
  }
}; 