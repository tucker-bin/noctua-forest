// Book Club Service
import { BaseService } from './BaseService.js';
import { serverTimestamp, addDoc, updateDoc, deleteDoc, doc, collection } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

class BookClubService extends BaseService {
    constructor() {
        super();
        this.BOOK_CLUBS_COLLECTION = 'bookClubs';
        this.MEMBERSHIPS_COLLECTION = 'memberships';
    }

    async getBookClub(clubId) {
        return await this.getDocument(this.BOOK_CLUBS_COLLECTION, clubId);
    }

    async getUserBookClubs(userId) {
        // Get clubs where user is owner
        const ownedConditions = [
            { field: 'ownerId', operator: '==', value: userId }
        ];
        const ownedClubs = await this.queryCollection(this.BOOK_CLUBS_COLLECTION, ownedConditions);

        // Get memberships
        const membershipConditions = [
            { field: 'userId', operator: '==', value: userId },
            { field: 'status', operator: '==', value: 'active' }
        ];
        const memberships = await this.queryCollection(this.MEMBERSHIPS_COLLECTION, membershipConditions);

        // Get clubs for memberships
        const memberClubs = await Promise.all(
            memberships.map(m => this.getBookClub(m.clubId))
        );

        // Combine and deduplicate
        const allClubs = [...ownedClubs, ...memberClubs.filter(Boolean)];
        const uniqueClubs = Array.from(
            new Map(allClubs.map(club => [club.id, club])).values()
        );

        return uniqueClubs;
    }

    async createBookClub(clubData) {
        try {
            this.validateRequired(clubData, ['name', 'ownerId']);

            const club = {
                name: clubData.name,
                description: clubData.description || '',
                ownerId: clubData.ownerId,
                settings: {
                    theme: clubData.theme || 'default',
                    isPublic: clubData.isPublic ?? true,
                    allowMemberInvites: clubData.allowMemberInvites ?? true,
                    ...clubData.settings
                },
                readingLists: clubData.readingLists || [],
                memberCount: 1, // Owner is first member
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(this.db, this.BOOK_CLUBS_COLLECTION), club);
            
            // Create owner membership
            await addDoc(collection(this.db, this.MEMBERSHIPS_COLLECTION), {
                clubId: docRef.id,
                userId: clubData.ownerId,
                role: 'owner',
                status: 'active',
                createdAt: serverTimestamp()
            });

            return { id: docRef.id, ...club };
        } catch (error) {
            throw this.handleError(error, 'Create Book Club');
        }
    }

    async updateBookClub(clubId, updates) {
        try {
            const clubRef = doc(this.db, this.BOOK_CLUBS_COLLECTION, clubId);
            await updateDoc(clubRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return await this.getBookClub(clubId);
        } catch (error) {
            throw this.handleError(error, 'Update Book Club');
        }
    }

    async deleteBookClub(clubId) {
        try {
            // Delete memberships first
            const membershipConditions = [
                { field: 'clubId', operator: '==', value: clubId }
            ];
            const memberships = await this.queryCollection(this.MEMBERSHIPS_COLLECTION, membershipConditions);
            
            await Promise.all(
                memberships.map(m => 
                    deleteDoc(doc(this.db, this.MEMBERSHIPS_COLLECTION, m.id))
                )
            );

            // Delete the club
            await deleteDoc(doc(this.db, this.BOOK_CLUBS_COLLECTION, clubId));
        } catch (error) {
            throw this.handleError(error, 'Delete Book Club');
        }
    }

    async addMember(clubId, userId, role = 'member') {
        try {
            // Check if membership already exists
            const conditions = [
                { field: 'clubId', operator: '==', value: clubId },
                { field: 'userId', operator: '==', value: userId }
            ];
            const existing = await this.queryCollection(this.MEMBERSHIPS_COLLECTION, conditions);
            
            if (existing.length > 0) {
                // Update existing membership if inactive
                if (existing[0].status !== 'active') {
                    await updateDoc(doc(this.db, this.MEMBERSHIPS_COLLECTION, existing[0].id), {
                        status: 'active',
                        updatedAt: serverTimestamp()
                    });
                }
                return existing[0];
            }

            // Create new membership
            const membership = {
                clubId,
                userId,
                role,
                status: 'active',
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(this.db, this.MEMBERSHIPS_COLLECTION), membership);

            // Update member count
            await updateDoc(doc(this.db, this.BOOK_CLUBS_COLLECTION, clubId), {
                memberCount: increment(1),
                updatedAt: serverTimestamp()
            });

            return { id: docRef.id, ...membership };
        } catch (error) {
            throw this.handleError(error, 'Add Member');
        }
    }

    async removeMember(clubId, userId) {
        try {
            // Find membership
            const conditions = [
                { field: 'clubId', operator: '==', value: clubId },
                { field: 'userId', operator: '==', value: userId },
                { field: 'status', operator: '==', value: 'active' }
            ];
            const memberships = await this.queryCollection(this.MEMBERSHIPS_COLLECTION, conditions);
            
            if (memberships.length === 0) {
                throw new Error('Membership not found');
            }

            const membership = memberships[0];

            // Don't allow removing the owner
            if (membership.role === 'owner') {
                throw new Error('Cannot remove club owner');
            }

            // Soft delete by marking inactive
            await updateDoc(doc(this.db, this.MEMBERSHIPS_COLLECTION, membership.id), {
                status: 'inactive',
                updatedAt: serverTimestamp()
            });

            // Update member count
            await updateDoc(doc(this.db, this.BOOK_CLUBS_COLLECTION, clubId), {
                memberCount: increment(-1),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            throw this.handleError(error, 'Remove Member');
        }
    }

    async checkMembershipStatus(clubId, userId) {
        try {
            const conditions = [
                { field: 'clubId', operator: '==', value: clubId },
                { field: 'userId', operator: '==', value: userId },
                { field: 'status', operator: '==', value: 'active' }
            ];
            const memberships = await this.queryCollection(this.MEMBERSHIPS_COLLECTION, conditions);
            
            return memberships.length > 0 ? memberships[0] : null;
        } catch (error) {
            // Silently handle permission errors as they are expected for regular users
            if (error.code === 'permission-denied') {
                return null;
            }
            throw this.handleError(error, 'Check Membership');
        }
    }
}

// Create singleton instance
const bookClubService = new BookClubService();
export default bookClubService;
