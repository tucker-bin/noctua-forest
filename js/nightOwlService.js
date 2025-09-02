// Night Owl Service - Handles user sales performance and status
import { db } from '../firebase-config.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const USERS_COLLECTION = 'users';
const SALES_COLLECTION = 'sales';
const LISTS_COLLECTION = 'reading_lists';

/**
 * Get a user's Night Owl sales performance
 */
export async function getNightOwlSalesStats(userId) {
    try {
        // Get monthly sales count for commission tier calculation
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const salesQuery = query(
            collection(db, SALES_COLLECTION),
            where('curatorId', '==', userId),
            where('createdAt', '>=', startOfMonth)
        );
        const salesSnap = await getDocs(salesQuery);
        const monthlySalesCount = salesSnap.size;

        // Get total sales for lifetime achievement
        const totalSalesQuery = query(
            collection(db, SALES_COLLECTION),
            where('curatorId', '==', userId)
        );
        const totalSalesSnap = await getDocs(totalSalesQuery);
        const totalSalesCount = totalSalesSnap.size;

        // Get commission rate based on monthly sales
        const commissionRate = getCommissionRate(monthlySalesCount);

        return {
            monthlySalesCount,
            totalSalesCount,
            commissionRate,
            currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
        };
    } catch (err) {
        console.error('Error getting Night Owl sales stats:', err);
        return {
            monthlySalesCount: 0,
            totalSalesCount: 0,
            commissionRate: 0.015, // Default 1.5%
            currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        };
    }
}

/**
 * Get commission rate based on monthly sales volume
 */
function getCommissionRate(monthlySalesCount) {
    if (monthlySalesCount >= 100) return 0.03; // 3% for 100+ books/month
    if (monthlySalesCount >= 15) return 0.0225; // 2.25% for 15+ books/month
    return 0.015; // 1.5% base rate
}

/**
 * Get Night Owl level based on sales performance
 */
export function getNightOwlLevel(monthlySalesCount, totalSalesCount) {
    if (monthlySalesCount >= 100) return { level: 'Elder Owl', badge: '🦉' };
    if (monthlySalesCount >= 15) return { level: 'Wise Owl', badge: '✨' };
    if (monthlySalesCount >= 5) return { level: 'Night Owl', badge: '🌙' };
    return { level: 'Fledgling', badge: '🪶' };
}

/**
 * Get top Night Owls based on sales performance
 */
export async function getTopNightOwls(limit = 10) {
    try {
        const users = [];
        const usersSnap = await getDocs(collection(db, USERS_COLLECTION));

        for (const userDoc of usersSnap.docs) {
            const salesStats = await getNightOwlSalesStats(userDoc.id);
            const { level, badge } = getNightOwlLevel(salesStats.monthlySalesCount, salesStats.totalSalesCount);
            
            users.push({
                id: userDoc.id,
                forestName: userDoc.data().forestName || 'Anonymous Night Owl',
                salesStats,
                level,
                badge
            });
        }

        // Sort by monthly sales count, then by total sales
        users.sort((a, b) => {
            if (a.salesStats.monthlySalesCount !== b.salesStats.monthlySalesCount) {
                return b.salesStats.monthlySalesCount - a.salesStats.monthlySalesCount;
            }
            return b.salesStats.totalSalesCount - a.salesStats.totalSalesCount;
        });

        return users.slice(0, limit);
    } catch (err) {
        console.error('Error getting top Night Owls:', err);
        return [];
    }
}

/**
 * Update user's Night Owl profile
 */
export async function updateNightOwlProfile(userId, profile) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, {
            forestName: profile.forestName,
            readingInterests: profile.readingInterests || [],
            favoriteGenres: profile.favoriteGenres || [],
            bio: profile.bio || '',
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (err) {
        console.error('Error updating Night Owl profile:', err);
        return false;
    }
}

/**
 * Get user's sales performance summary
 */
export async function getUserSalesSummary(userId) {
    try {
        const salesStats = await getNightOwlSalesStats(userId);
        const { level, badge } = getNightOwlLevel(salesStats.monthlySalesCount, salesStats.totalSalesCount);
        
        return {
            level,
            badge,
            commissionRate: salesStats.commissionRate,
            performance: {
                monthlySales: salesStats.monthlySalesCount,
                totalSales: salesStats.totalSalesCount,
                currentMonth: salesStats.currentMonth
            },
            nextTier: getNextTierInfo(salesStats.monthlySalesCount)
        };
    } catch (err) {
        console.error('Error getting user sales summary:', err);
        return null;
    }
}

/**
 * Get information about the next commission tier
 */
function getNextTierInfo(currentMonthlySales) {
    if (currentMonthlySales >= 100) {
        return { 
            nextTier: 'Maximum tier reached',
            salesNeeded: 0,
            commissionIncrease: 0
        };
    } else if (currentMonthlySales >= 15) {
        return {
            nextTier: 'Elder Owl (3% commission)',
            salesNeeded: 100 - currentMonthlySales,
            commissionIncrease: 0.0075
        };
    } else {
        return {
            nextTier: 'Wise Owl (2.25% commission)',
            salesNeeded: 15 - currentMonthlySales,
            commissionIncrease: 0.0075
        };
    }
}
