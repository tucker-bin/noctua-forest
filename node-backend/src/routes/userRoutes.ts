import express from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/users', async (req, res) => {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            res.status(404).json({ message: 'No users found' });
            return;
        }

        const usersList = snapshot.docs.map(doc => {
            const userData = doc.data();
            return {
                id: doc.id,
                artistName: userData.displayName || 'Anonymous',
                genre: userData.genre || 'Observer',
                location: userData.location || 'The Forest',
                avatar: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
                bio: userData.bio || 'A denizen of the Noctua Forest.',
            };
        });

        res.status(200).json(usersList);
    } catch (error) {
        logger.error({
            message: 'Error fetching users from Firestore',
            error: error,
            path: '/users'
        });
        res.status(500).json({ error: 'Could not fetch users from database.' });
        return;
    }
});

export default router; 