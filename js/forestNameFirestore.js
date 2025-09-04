// Forest Name Firestore Integration
import { db } from '../firebase-config.js';
import { 
    collection, doc, getDoc, setDoc, getDocs, 
    query, where, updateDoc, deleteDoc, writeBatch, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { generateForestNameForUser } from './forestNameService.js';

const FOREST_NAMES_COLLECTION = 'forestNames';
const USERS_COLLECTION = 'users';

// Removed initializeFromFirestore - no longer needed

/**
 * Get a user's forest name
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string|null>} Forest name or null if not found
 */
export async function getUserForestName(userId) {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    return userDoc.exists() ? userDoc.data().forestName : null;
}

/**
 * Generate and assign a new forest name to a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string>} The assigned forest name
 * @throws {Error} If name generation fails or user already has a name
 */
export async function assignNewForestName(userId) {
    // Check if user already has a forest name
    const existingName = await getUserForestName(userId);
    if (existingName) {
        throw new Error('User already has a forest name');
    }

    // Generate new unique name using the service
    const newName = await generateForestNameForUser(userId);
    if (!newName) {
        throw new Error('Could not generate unique forest name');
    }

    // Save to Firestore atomically
    const batch = writeBatch(db);
    
    // Add to forest names collection
    const forestNameDoc = doc(db, FOREST_NAMES_COLLECTION, userId);
    batch.set(forestNameDoc, {
        name: newName,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // Update user document
    const userDoc = doc(db, USERS_COLLECTION, userId);
    // Ensure user doc exists before update; use set with merge for safety
    batch.set(userDoc, {
        forestName: newName,
        forestNameUpdatedAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();
    return newName;
}

/**
 * Update a user's forest name
 * @param {string} userId - Firebase user ID
 * @param {string} newName - New forest name
 * @returns {Promise<void>}
 * @throws {Error} If name is taken or invalid
 */
export async function updateForestName(userId, newName) {
    // Check if name is taken by someone else
    const nameQuery = query(
        collection(db, FOREST_NAMES_COLLECTION), 
        where('name', '==', newName),
        where('userId', '!=', userId)
    );
    const nameSnapshot = await getDocs(nameQuery);
    if (!nameSnapshot.empty) {
        throw new Error('Forest name is already taken');
    }

    const batch = writeBatch(db);

    // Update forest names collection
    const forestNameDoc = doc(db, FOREST_NAMES_COLLECTION, userId);
    batch.set(forestNameDoc, {
        name: newName,
        userId,
        updatedAt: serverTimestamp()
    }, { merge: true });

    // Update user document
    const userDoc = doc(db, USERS_COLLECTION, userId);
    batch.set(userDoc, {
        forestName: newName,
        forestNameUpdatedAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();
}

/**
 * Check if a forest name is available
 * @param {string} name - Name to check
 * @returns {Promise<boolean>} True if name is available
 */
export async function isForestNameAvailable(name) {
    const nameQuery = query(
        collection(db, FOREST_NAMES_COLLECTION), 
        where('name', '==', name)
    );
    const nameSnapshot = await getDocs(nameQuery);
    return nameSnapshot.empty;
}

/**
 * Get all forest names for a list of user IDs
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<Map<string, string>>} Map of userId to forest name
 */
export async function getForestNamesByUserIds(userIds) {
    const names = new Map();
    const chunks = [];
    
    // Firestore has a limit of 10 'in' clauses
    for (let i = 0; i < userIds.length; i += 10) {
        chunks.push(userIds.slice(i, i + 10));
    }

    await Promise.all(chunks.map(async chunk => {
        const q = query(collection(db, FOREST_NAMES_COLLECTION), where('userId', 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            names.set(doc.data().userId, doc.data().name);
        });
    }));

    return names;
}
