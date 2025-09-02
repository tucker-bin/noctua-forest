// Owl Name Service - Night Owl themed name generation
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// Night Owl themed adjectives and descriptors
const FIRST_PARTS = [
    // Nocturnal/Time
    'Night', 'Midnight', 'Twilight', 'Dusk', 'Dawn', 'Moon', 'Star',
    
    // Colors/Appearance
    'Silver', 'Shadow', 'Mist', 'Ghost', 'Storm', 'Frost', 'Ember',
    
    // Nature
    'Forest', 'Mountain', 'River', 'Valley', 'Grove', 'Meadow', 'Glen',
    
    // Qualities
    'Wise', 'Silent', 'Swift', 'Keen', 'Noble', 'Mystic', 'Ancient'
];

const SECOND_PARTS = [
    // Owl Types
    'Owl', 'Barn', 'Screech', 'Horned', 'Snowy', 'Tawny', 'Eagle',
    
    // Actions
    'Watcher', 'Seeker', 'Hunter', 'Glider', 'Soarer', 'Keeper', 'Guardian',
    
    // Nature
    'Wing', 'Feather', 'Talon', 'Flight', 'Gaze', 'Sight', 'Call',
    
    // Places
    'Perch', 'Roost', 'Hollow', 'Nest', 'Haven', 'Grove', 'Glade'
];

const TITLES = {
    'Fledgling': ['Young', 'New', 'Fresh', 'Budding', 'Rising'],
    'Night Owl': ['Keen', 'Sharp', 'Swift', 'Bright', 'Quick'],
    'Wise Owl': ['Sage', 'Learned', 'Knowing', 'Astute', 'Shrewd'],
    'Elder Owl': ['Ancient', 'Revered', 'Honored', 'Esteemed', 'Venerable']
};

/**
 * Generate a random Owl Name with optional title based on level
 */
function generateOwlName(level = null) {
    const first = FIRST_PARTS[Math.floor(Math.random() * FIRST_PARTS.length)];
    const second = SECOND_PARTS[Math.floor(Math.random() * SECOND_PARTS.length)];
    let name = `${first}${second}`;

    // Add title if level is provided
    if (level && TITLES[level]) {
        const titles = TITLES[level];
        const title = titles[Math.floor(Math.random() * titles.length)];
        name = `${title} ${name}`;
    }

    return name;
}

/**
 * Check if a name is available
 */
async function isNameAvailable(name) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('owlName', '==', name));
        const snapshot = await getDocs(q);
        return snapshot.empty;
    } catch (err) {
        console.error('Error checking name availability:', err);
        return false;
    }
}

/**
 * Generate a unique name for the given level
 */
async function generateUniqueName(level = null) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const name = generateOwlName(level);
        if (await isNameAvailable(name)) {
            return name;
        }
        attempts++;
    }

    // If we couldn't find a unique name, add a random number
    const baseName = generateOwlName(level);
    const randomNum = Math.floor(Math.random() * 1000);
    return `${baseName}${randomNum}`;
}

/**
 * Set a user's Owl Name
 */
export async function setOwlName(userId, owlName) {
    try {
        // Check if name is available (unless it's their current name)
        const userDoc = await getDoc(doc(db, 'users', userId));
        const currentName = userDoc.exists() ? userDoc.data().owlName : null;
        
        if (owlName !== currentName && !(await isNameAvailable(owlName))) {
            throw new Error('This name is already taken');
        }

        // Update user document
        await setDoc(doc(db, 'users', userId), {
            owlName,
            updatedAt: new Date()
        }, { merge: true });

        return owlName;
    } catch (err) {
        console.error('Error setting Owl Name:', err);
        throw err;
    }
}

/**
 * Get a user's Owl Name
 */
export async function getOwlName(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            return null;
        }
        return userDoc.data().owlName || null;
    } catch (err) {
        console.error('Error getting Owl Name:', err);
        return null;
    }
}

/**
 * Generate and set a random Owl Name for a user based on their level
 */
export async function generateOwlNameForUser(userId) {
    try {
        // Get user's current level
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const level = userData.owlLevel || 'Fledgling';

        const name = await generateUniqueName(level);
        await setOwlName(userId, name);
        return name;
    } catch (err) {
        console.error('Error generating Owl Name:', err);
        throw err;
    }
}

/**
 * Validate an Owl Name
 */
export function validateOwlName(name) {
    // Must be 3-30 characters
    if (name.length < 3 || name.length > 30) {
        return {
            valid: false,
            error: 'Name must be between 3 and 30 characters'
        };
    }

    // Only letters, numbers, and spaces
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
        return {
            valid: false,
            error: 'Name can only contain letters, numbers, and spaces'
        };
    }

    return { valid: true };
}

/**
 * Format an Owl Name for display
 */
export function formatOwlName(name) {
    if (!name) return 'Anonymous Night Owl';
    return name;
}

/**
 * Update a user's name when their level changes
 */
export async function updateNameForLevel(userId, newLevel) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) return null;

        const userData = userDoc.data();
        const currentName = userData.owlName;

        // If they have a custom name, don't change it
        if (userData.hasCustomName) return currentName;

        // Generate new name with title
        const newName = await generateUniqueName(newLevel);
        await setOwlName(userId, newName);
        return newName;
    } catch (err) {
        console.error('Error updating name for level:', err);
        return null;
    }
}
