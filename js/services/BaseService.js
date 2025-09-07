// Base Service Class
import { db } from '../../firebase-config.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export class BaseService {
    constructor() {
        this.db = db;
    }

    // Protected helper methods
    async getDocument(collectionName, docId) {
        try {
            const docRef = doc(this.db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            console.error(`Error fetching document from ${collectionName}:`, error);
            throw error;
        }
    }

    async queryCollection(collectionName, conditions = [], orderByField = null, limitCount = null) {
        try {
            let q = collection(this.db, collectionName);
            
            // Add where conditions
            if (conditions.length > 0) {
                q = query(q, ...conditions.map(c => where(c.field, c.operator, c.value)));
            }

            // Add orderBy if specified
            if (orderByField) {
                q = query(q, orderBy(orderByField));
            }

            // Add limit if specified
            if (limitCount) {
                q = query(q, limit(limitCount));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error querying ${collectionName}:`, error);
            throw error;
        }
    }

    handleError(error, context = '') {
        // Log error with context
        console.error(`${context} Error:`, error);

        // Standardize error messages
        const errorMessages = {
            'permission-denied': 'You do not have permission to perform this action',
            'not-found': 'The requested resource was not found',
            'already-exists': 'This resource already exists',
            'invalid-argument': 'Invalid data provided',
            'failed-precondition': 'Operation cannot be performed in current state',
            'unauthenticated': 'Please sign in to continue'
        };

        // Return standardized error
        return new Error(errorMessages[error.code] || error.message);
    }

    // Utility methods
    formatTimestamp(timestamp) {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate();
        if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
        return new Date(timestamp);
    }

    validateRequired(data, fields) {
        const missing = fields.filter(field => !data[field]);
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }
}
