// Forest Name Service
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// Forest-themed adjectives and nouns for name generation
const adjectives = [
  'Ancient', 'Whispering', 'Mystic', 'Emerald', 'Silent', 'Hidden', 'Moonlit',
  'Twilight', 'Verdant', 'Mossy', 'Misty', 'Wandering', 'Starlit', 'Dappled',
  'Peaceful', 'Wise', 'Wild', 'Gentle', 'Serene', 'Enchanted', 'Luminous',
  'Shadowed', 'Tranquil', 'Ethereal', 'Glowing', 'Dreaming', 'Radiant', 'Sacred'
];

const nouns = [
  'Grove', 'Owl', 'Pine', 'Brook', 'Maple', 'Fern', 'Oak', 'Birch', 'Willow',
  'Stream', 'Raven', 'Fox', 'Deer', 'Wolf', 'Hawk', 'Cedar', 'Path', 'Glade',
  'Spring', 'Hollow', 'Vale', 'Ridge', 'Thicket', 'Meadow', 'Glen', 'Haven',
  'Copse', 'Clearing', 'Pond', 'Aspen', 'Elm', 'Wren', 'Sparrow', 'Jay'
];

/**
 * Generate a random Forest Name
 */
function generateForestName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

/**
 * Check if a Forest Name is available
 */
async function isNameAvailable(name) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('forestName', '==', name));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (err) {
    console.error('Error checking name availability:', err);
    return false;
  }
}

/**
 * Generate a unique Forest Name
 */
async function generateUniqueName() {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const name = generateForestName();
    if (await isNameAvailable(name)) {
      return name;
    }
    attempts++;
  }

  // If we couldn't find a unique name, add a random number
  const baseForestName = generateForestName();
  const randomNum = Math.floor(Math.random() * 1000);
  return `${baseForestName}${randomNum}`;
}

/**
 * Set a user's Forest Name
 */
export async function setForestName(userId, forestName) {
  try {
    // Check if name is available (unless it's their current name)
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentName = userDoc.exists() ? userDoc.data().forestName : null;
    
    if (forestName !== currentName && !(await isNameAvailable(forestName))) {
      throw new Error('This Forest Name is already taken');
    }

    // Update user document
    await setDoc(doc(db, 'users', userId), {
      forestName,
      updatedAt: new Date()
    }, { merge: true });

    return forestName;
  } catch (err) {
    console.error('Error setting Forest Name:', err);
    throw err;
  }
}

/**
 * Get a user's Forest Name
 */
export async function getForestName(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data().forestName || null;
  } catch (err) {
    console.error('Error getting Forest Name:', err);
    return null;
  }
}

/**
 * Generate and set a random Forest Name for a user
 */
export async function generateForestNameForUser(userId) {
  try {
    const name = await generateUniqueName();
    await setForestName(userId, name);
    return name;
  } catch (err) {
    console.error('Error generating Forest Name:', err);
    throw err;
  }
}

/**
 * Validate a Forest Name
 */
export function validateForestName(name) {
  // Must be 3-30 characters
  if (name.length < 3 || name.length > 30) {
    return {
      valid: false,
      error: 'Forest Name must be between 3 and 30 characters'
    };
  }

  // Only letters, numbers, and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return {
      valid: false,
      error: 'Forest Name can only contain letters, numbers, and underscores'
    };
  }

  return { valid: true };
}

/**
 * Format a Forest Name for display
 */
export function formatForestName(name) {
  if (!name) return 'Anonymous Forest Dweller';
  
  // Add spaces before capital letters (except first letter)
  return name.replace(/([A-Z])/g, ' $1').trim();
}