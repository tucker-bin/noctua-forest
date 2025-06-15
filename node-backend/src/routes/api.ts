import express from 'express';
import observeRoutes from './observeRoutes';

const router = express.Router();

router.use('/observe', observeRoutes);

export default router; 