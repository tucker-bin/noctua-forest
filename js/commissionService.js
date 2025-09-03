// Commission Service - Handles Night Owl commission rates and tracking
import { db } from '../firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const SALES_COLLECTION = 'sales';

// Commission tiers based on monthly sales volume
const COMMISSION_TIERS = {
    BASE: {
        rate: 0.015,      // 1.5%
        threshold: 0
    },
    INTERMEDIATE: {
        rate: 0.0225,     // 2.25%
        threshold: 15
    },
    ADVANCED: {
        rate: 0.03,       // 3%
        threshold: 100
    }
};

/**
 * Get commission rate based on monthly sales volume
 */
export async function getCommissionRate(userId) {
    try {
        // Calculate start of current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get monthly sales count
        const salesQuery = query(
            collection(db, SALES_COLLECTION),
            where('referrerId', '==', userId),
            where('createdAt', '>=', monthStart),
            where('status', '==', 'completed')
        );
        const salesSnap = await getDocs(salesQuery);
        const monthlySales = salesSnap.size;

        // Determine tier based on sales volume
        if (monthlySales >= COMMISSION_TIERS.ADVANCED.threshold) {
            return COMMISSION_TIERS.ADVANCED.rate;
        } else if (monthlySales >= COMMISSION_TIERS.INTERMEDIATE.threshold) {
            return COMMISSION_TIERS.INTERMEDIATE.rate;
        }
        return COMMISSION_TIERS.BASE.rate;
    } catch (err) {
        console.error('Error getting commission rate:', err);
        return COMMISSION_TIERS.BASE.rate; // Default to base rate on error
    }
}

/**
 * Get commission earnings for a period
 */
export async function getCommissionEarnings(userId, startDate, endDate = new Date()) {
    try {
        const salesQuery = query(
            collection(db, SALES_COLLECTION),
            where('referrerId', '==', userId),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            where('status', '==', 'completed')
        );
        const salesSnap = await getDocs(salesQuery);
        
        let total = 0;
        salesSnap.forEach(doc => {
            const sale = doc.data();
            total += sale.amount * sale.commissionRate;
        });

        return total;
    } catch (err) {
        console.error('Error getting commission earnings:', err);
        return 0;
    }
}

/**
 * Track a new sale
 */
export async function trackSale(userId, saleData) {
    try {
        const rate = await getCommissionRate(userId);
        const saleRef = doc(collection(db, SALES_COLLECTION));
        
        await setDoc(saleRef, {
            id: saleRef.id,
            referrerId: userId,
            amount: saleData.amount,
            productId: saleData.productId,
            commissionRate: rate,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        return saleRef.id;
    } catch (err) {
        console.error('Error tracking sale:', err);
        throw err;
    }
}

/**
 * Get progress to next tier
 */
export async function getNextTierProgress(userId) {
    try {
        // Get current month's sales
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const salesQuery = query(
            collection(db, SALES_COLLECTION),
            where('referrerId', '==', userId),
            where('createdAt', '>=', monthStart),
            where('status', '==', 'completed')
        );
        const salesSnap = await getDocs(salesQuery);
        const monthlySales = salesSnap.size;

        // Determine next tier
        if (monthlySales < COMMISSION_TIERS.INTERMEDIATE.threshold) {
            return {
                current: monthlySales,
                target: COMMISSION_TIERS.INTERMEDIATE.threshold,
                nextRate: COMMISSION_TIERS.INTERMEDIATE.rate
            };
        } else if (monthlySales < COMMISSION_TIERS.ADVANCED.threshold) {
            return {
                current: monthlySales,
                target: COMMISSION_TIERS.ADVANCED.threshold,
                nextRate: COMMISSION_TIERS.ADVANCED.rate
            };
        }

        // Already at highest tier
        return null;
    } catch (err) {
        console.error('Error getting tier progress:', err);
        return null;
    }
}

/**
 * Get monthly sales stats
 */
export async function getMonthlySalesStats(userId) {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const salesQuery = query(
            collection(db, SALES_COLLECTION),
            where('referrerId', '==', userId),
            where('createdAt', '>=', monthStart),
            where('status', '==', 'completed')
        );
        const salesSnap = await getDocs(salesQuery);
        
        let totalSales = 0;
        let totalEarnings = 0;
        
        salesSnap.forEach(doc => {
            const sale = doc.data();
            totalSales++;
            totalEarnings += sale.amount * sale.commissionRate;
        });

        const rate = await getCommissionRate(userId);
        const nextTier = await getNextTierProgress(userId);

        return {
            totalSales,
            totalEarnings,
            currentRate: rate,
            nextTier,
            daysLeft: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
        };
    } catch (err) {
        console.error('Error getting monthly stats:', err);
        return null;
    }
}

/**
 * Get comprehensive earnings data for dashboard
 */
export async function getCommissionEarningsSummary(userId) {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        // Get monthly earnings
        const monthlyEarnings = await getCommissionEarnings(userId, monthStart, now);
        
        // Get 30-day earnings
        const last30DaysEarnings = await getCommissionEarnings(userId, thirtyDaysAgo, now);
        
        // Get lifetime earnings (from beginning of time)
        const lifetimeEarnings = await getCommissionEarnings(userId, new Date(0), now);
        
        return {
            monthly: monthlyEarnings.toFixed(2),
            last30Days: last30DaysEarnings.toFixed(2),
            lifetime: lifetimeEarnings.toFixed(2)
        };
    } catch (err) {
        console.error('Error getting commission earnings:', err);
        return {
            monthly: '0.00',
            last30Days: '0.00',
            lifetime: '0.00'
        };
    }
}