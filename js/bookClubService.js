// Book Club Service
import { db } from '../firebase-config.js';
import { 
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp, limit 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// Collections
const BOOK_CLUBS_COLLECTION = 'bookClubs';
const BOOK_CLUB_LISTS_COLLECTION = 'bookClubLists';
const CLICK_TRACKING_COLLECTION = 'listClicks';

/**
 * Create a new curator page (book club)
 * @param {string} userId - Owner's user ID
 * @param {object} data - Club data
 * @returns {Promise<string>} - ID of created club
 */
export async function createCuratorPage(userId, data) {
    const clubData = {
        ...data,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, BOOK_CLUBS_COLLECTION), clubData);
    return docRef.id;
}

/**
 * Get a curator page by ID
 * @param {string} pageId - Club ID
 * @returns {Promise<object|null>} - Club data or null if not found
 */
export async function getCuratorPage(pageId) {
    const docRef = doc(db, BOOK_CLUBS_COLLECTION, pageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    
    return null;
}

/**
 * Update a curator page
 * @param {string} pageId - Club ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateCuratorPage(pageId, updates) {
    const docRef = doc(db, BOOK_CLUBS_COLLECTION, pageId);
    
    const updatedData = {
        ...updates,
        updatedAt: serverTimestamp()
    };
    
    return updateDoc(docRef, updatedData);
}

/**
 * Add a reading list to a curator page
 * @param {string} pageId - Club ID
 * @param {string} listId - Reading list ID
 * @param {string} title - Optional custom title for the list
 * @param {string} description - Optional custom description
 * @returns {Promise<string>} - ID of the association
 */
export async function addListToCuratorPage(pageId, listId, title = '', description = '') {
    const association = {
        clubId: pageId,
        listId: listId,
        title: title,
        description: description,
        order: 999, // Default to end of list
        addedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, BOOK_CLUB_LISTS_COLLECTION), association);
    return docRef.id;
}

/**
 * Remove a reading list from a curator page
 * @param {string} associationId - ID of the club-list association
 * @returns {Promise<void>}
 */
export async function removeListFromCuratorPage(associationId) {
    const docRef = doc(db, BOOK_CLUB_LISTS_COLLECTION, associationId);
    return deleteDoc(docRef);
}

/**
 * Get all reading lists for a curator page
 * @param {string} pageId - Club ID
 * @returns {Promise<Array>} - Array of list associations
 */
export async function getCuratorPageLists(pageId) {
    const q = query(
        collection(db, BOOK_CLUB_LISTS_COLLECTION),
        where('clubId', '==', pageId),
        orderBy('order', 'asc'),
        orderBy('addedAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Update the display order of a list
 * @param {string} associationId - ID of the club-list association
 * @param {number} order - New order position
 * @returns {Promise<void>}
 */
export async function updateListOrder(associationId, order) {
    const docRef = doc(db, BOOK_CLUB_LISTS_COLLECTION, associationId);
    return updateDoc(docRef, { order });
}

/**
 * Track a click on a book in a list
 * @param {string} pageId - Club ID
 * @param {string} listId - Reading list ID
 * @param {string} bookId - Book ID
 * @param {string} visitorId - Anonymous visitor ID
 * @returns {Promise<void>}
 */
export async function trackBookClick(pageId, listId, bookId, visitorId) {
    return addDoc(collection(db, CLICK_TRACKING_COLLECTION), {
        pageId,
        listId,
        bookId,
        visitorId,
        timestamp: serverTimestamp()
    });
}

/**
 * Generate a QR code URL for a curator page
 * @param {string} pageId - Club ID
 * @returns {string} - URL to generate QR code
 */
export function generateQRCodeUrl(pageId) {
    const pageUrl = `${window.location.origin}/club.html?id=${pageId}`;
    // Using Google Charts API for QR code generation
    return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(pageUrl)}`;
}

/**
 * Generate HTML embed code for a curator page
 * @param {string} pageId - Club ID
 * @param {string} pageName - Name of the page
 * @returns {string} - HTML iframe code
 */
export function generateEmbedCode(pageId, pageName) {
    const pageUrl = `${window.location.origin}/club.html?id=${pageId}`;
    return `<iframe src="${pageUrl}" title="${pageName || 'Book Recommendations'}" width="100%" height="600" frameborder="0"></iframe>`;
}

// Book Club Members Management
const BOOK_CLUB_MEMBERS_COLLECTION = 'bookClubMembers';

/**
 * Get all book clubs owned by a user
 * @param {string} userId - Owner's user ID
 * @returns {Promise<Array>} - Array of book clubs
 */
export async function getUserBookClubs(userId) {
    const q = query(
        collection(db, BOOK_CLUBS_COLLECTION),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Get members of a book club
 * @param {string} clubId - Book club ID
 * @returns {Promise<Array>} - Array of club members
 */
export async function getBookClubMembers(clubId) {
    const q = query(
        collection(db, BOOK_CLUB_MEMBERS_COLLECTION),
        where('clubId', '==', clubId),
        orderBy('joinedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Add a member to a book club
 * @param {string} clubId - Book club ID
 * @param {string} ownerId - Club owner's user ID
 * @param {string} userEmail - New member's email
 * @returns {Promise<string>} - ID of the membership record
 */
export async function addMemberToBookClub(clubId, ownerId, userEmail) {
    // Check if user exists by email (this would need to be implemented with a cloud function in production)
    // For now, we'll create a pending invitation
    const membership = {
        clubId,
        ownerId,
        userEmail: userEmail.toLowerCase(),
        status: 'pending', // pending, active, declined
        joinedAt: serverTimestamp(),
        invitedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, BOOK_CLUB_MEMBERS_COLLECTION), membership);
    return docRef.id;
}

/**
 * Remove a member from a book club
 * @param {string} membershipId - Membership record ID
 * @returns {Promise<void>}
 */
export async function removeMemberFromBookClub(membershipId) {
    const docRef = doc(db, BOOK_CLUB_MEMBERS_COLLECTION, membershipId);
    return deleteDoc(docRef);
}

/**
 * Get total member count across all user's book clubs
 * @param {string} userId - Owner's user ID
 * @returns {Promise<number>} - Total member count
 */
export async function getTotalMemberCount(userId) {
    const clubs = await getUserBookClubs(userId);
    let totalMembers = 0;
    
    for (const club of clubs) {
        const members = await getBookClubMembers(club.id);
        totalMembers += members.filter(m => m.status === 'active').length;
    }
    
    return totalMembers;
}

/**
 * Update member status (accept/decline invitation)
 * @param {string} membershipId - Membership record ID
 * @param {string} status - New status (active, declined)
 * @returns {Promise<void>}
 */
export async function updateMemberStatus(membershipId, status) {
    const docRef = doc(db, BOOK_CLUB_MEMBERS_COLLECTION, membershipId);
    return updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
    });
}
