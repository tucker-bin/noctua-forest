import express, { Request, Response } from 'express';
import { promClient } from '../config/prometheus';

const router = express.Router();

router.get('/metrics', async (req: Request, res: Response) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (ex: any) {
        res.status(500).end(ex);
    }
});

export default router; 