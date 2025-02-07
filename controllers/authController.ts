import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import prisma from "../DB/db.config";
import bcrypt from 'bcrypt';
import { sendOtpEmail } from "./emailVerification";

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

export const signup = async (req: Request, res: Response): Promise<any> => {
    const { name, email, password } = req.body;

    try {
        const findUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (findUser) {
            return res.status(400).json({ error: "email already exists" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
            }
        });
        const otp = await sendOtpEmail(email);
        const newUser = await prisma.user.update({
            where: {
                email: email
            }, data: {
                otp: otp
            }
        });
        res.json({ message: 'Signup successful, Please verify your otp' });
    }
    catch (error) {
        res.status(500).json({ error: "Error during signup" });
    }
}