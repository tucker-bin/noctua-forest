// Analytics Service for Curator Plus
import { db } from '../firebase-config.js';
import { 
    collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc,
    query, where, orderBy, serverTimestamp, increment, limit 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const ANALYTICS_COLLECTION = 'analytics';
const LIST_VIEWS_COLLECTION = 'listViews';
const LIST_CLICKS_COLLECTION = 'listClicks';
const SALES_COLLECTION = 'sales';

/**
 * Track a list view
 * @param {string} listId - The list ID
 * @param {string} userId - The curator's user ID
 * @param {string} [referrer] - Where the view came from
 */
export async function trackListView(listId, userId, referrer = 'direct') {
    try {
        // Track individual view
        await addDoc(collection(db, LIST_VIEWS_COLLECTION), {
            listId,
            userId,
            referrer,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            ip: 'anonymous' // We don't collect IPs for privacy
        });

        // Update daily summary
        const today = new Date().toISOString().split('T')[0];
        const summaryDoc = doc(db, ANALYTICS_COLLECTION, `${userId}_${today}`);
        
        await setDoc(summaryDoc, {
            userId,
            date: today,
            listViews: increment(1),
            lastUpdated: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error('Error tracking list view:', error);
    }
}

/**
 * Track a click on a book from a list
 * @param {string} listId - The list ID
 * @param {string} bookId - The book ID
 * @param {string} userId - The curator's user ID
 * @param {string} [source] - Where the click came from
 */
export async function trackBookClick(listId, bookId, userId, source = 'list') {
    try {
        // Track individual click
        await addDoc(collection(db, LIST_CLICKS_COLLECTION), {
            listId,
            bookId,
            userId,
            source,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
        });

        // Update daily summary
        const today = new Date().toISOString().split('T')[0];
        const summaryDoc = doc(db, ANALYTICS_COLLECTION, `${userId}_${today}`);
        
        await setDoc(summaryDoc, {
            userId,
            date: today,
            bookClicks: increment(1),
            lastUpdated: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error('Error tracking book click:', error);
    }
}

/**
 * Track a sale attributed to a curator
 * @param {string} curatorId - The curator's user ID
 * @param {string} bookId - The book ID
 * @param {number} saleAmount - The sale amount
 * @param {string} [listId] - The list that led to the sale
 */
export async function trackSale(curatorId, bookId, saleAmount, listId = null) {
    try {
        // Track individual sale
        await addDoc(collection(db, SALES_COLLECTION), {
            curatorId,
            bookId,
            listId,
            saleAmount,
            timestamp: serverTimestamp(),
            commission: saleAmount * 0.015 // 1.5% base rate
        });

        // Update daily summary
        const today = new Date().toISOString().split('T')[0];
        const summaryDoc = doc(db, ANALYTICS_COLLECTION, `${curatorId}_${today}`);
        
        await setDoc(summaryDoc, {
            userId: curatorId,
            date: today,
            sales: increment(1),
            revenue: increment(saleAmount),
            commission: increment(saleAmount * 0.015),
            lastUpdated: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error('Error tracking sale:', error);
    }
}

/**
 * Get analytics for a curator
 * @param {string} userId - The curator's user ID
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<Object>} Analytics data
 */
export async function getCuratorAnalytics(userId, days = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        // Get daily summaries
        const summariesQuery = query(
            collection(db, ANALYTICS_COLLECTION),
            where('userId', '==', userId),
            where('date', '>=', startDate.toISOString().split('T')[0]),
            orderBy('date', 'desc')
        );

        const summariesSnap = await getDocs(summariesQuery);
        const summaries = [];
        summariesSnap.forEach(doc => {
            summaries.push({ id: doc.id, ...doc.data() });
        });

        // Calculate totals
        const totals = summaries.reduce((acc, summary) => {
            acc.listViews += summary.listViews || 0;
            acc.bookClicks += summary.bookClicks || 0;
            acc.sales += summary.sales || 0;
            acc.revenue += summary.revenue || 0;
            acc.commission += summary.commission || 0;
            return acc;
        }, {
            listViews: 0,
            bookClicks: 0,
            sales: 0,
            revenue: 0,
            commission: 0
        });

        // Get top performing lists
        const listViewsQuery = query(
            collection(db, LIST_VIEWS_COLLECTION),
            where('userId', '==', userId),
            where('timestamp', '>=', startDate),
            orderBy('timestamp', 'desc')
        );

        const listViewsSnap = await getDocs(listViewsQuery);
        const listViewCounts = {};
        listViewsSnap.forEach(doc => {
            const data = doc.data();
            listViewCounts[data.listId] = (listViewCounts[data.listId] || 0) + 1;
        });

        const topLists = Object.entries(listViewCounts)
            .map(([listId, views]) => ({ listId, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        // Get top performing books
        const bookClicksQuery = query(
            collection(db, LIST_CLICKS_COLLECTION),
            where('userId', '==', userId),
            where('timestamp', '>=', startDate),
            orderBy('timestamp', 'desc')
        );

        const bookClicksSnap = await getDocs(bookClicksQuery);
        const bookClickCounts = {};
        bookClicksSnap.forEach(doc => {
            const data = doc.data();
            bookClickCounts[data.bookId] = (bookClickCounts[data.bookId] || 0) + 1;
        });

        const topBooks = Object.entries(bookClickCounts)
            .map(([bookId, clicks]) => ({ bookId, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 5);

        return {
            summaries,
            totals,
            topLists,
            topBooks,
            period: { start: startDate, end: endDate, days }
        };

    } catch (error) {
        console.error('Error getting curator analytics:', error);
        return {
            summaries: [],
            totals: { listViews: 0, bookClicks: 0, sales: 0, revenue: 0, commission: 0 },
            topLists: [],
            topBooks: [],
            period: { start: new Date(), end: new Date(), days }
        };
    }
}

/**
 * Get analytics for a specific list
 * @param {string} listId - The list ID
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<Object>} List analytics data
 */
export async function getListAnalytics(listId, days = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        // Get list views
        const viewsQuery = query(
            collection(db, LIST_VIEWS_COLLECTION),
            where('listId', '==', listId),
            where('timestamp', '>=', startDate),
            orderBy('timestamp', 'desc')
        );

        const viewsSnap = await getDocs(viewsQuery);
        const views = [];
        viewsSnap.forEach(doc => {
            views.push({ id: doc.id, ...doc.data() });
        });

        // Get book clicks from this list
        const clicksQuery = query(
            collection(db, LIST_CLICKS_COLLECTION),
            where('listId', '==', listId),
            where('timestamp', '>=', startDate),
            orderBy('timestamp', 'desc')
        );

        const clicksSnap = await getDocs(clicksQuery);
        const clicks = [];
        clicksSnap.forEach(doc => {
            clicks.push({ id: doc.id, ...doc.data() });
        });

        // Calculate click-through rate
        const totalViews = views.length;
        const totalClicks = clicks.length;
        const ctr = totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(1) : 0;

        return {
            views,
            clicks,
            totalViews,
            totalClicks,
            ctr: parseFloat(ctr),
            period: { start: startDate, end: endDate, days }
        };

    } catch (error) {
        console.error('Error getting list analytics:', error);
        return {
            views: [],
            clicks: [],
            totalViews: 0,
            totalClicks: 0,
            ctr: 0,
            period: { start: new Date(), end: new Date(), days }
        };
    }
}

/**
 * Get analytics for user dashboard
 */
export async function getAnalyticsForUser(userId) {
    try {
        const analytics = await getCuratorAnalytics(userId, 30);
        
        // Transform data for dashboard display
        return analytics.topLists.map(list => ({
            listId: list.listId,
            listName: `List ${list.listId.slice(0, 8)}...`, // TODO: Get actual list name
            views: list.views,
            saves: 0, // TODO: Calculate from list saves
            ctr: '0%' // TODO: Calculate from clicks/views
        }));
    } catch (error) {
        console.error('Error getting analytics for user:', error);
        return [];
    }
}