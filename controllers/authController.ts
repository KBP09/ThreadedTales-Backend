import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config();
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
}