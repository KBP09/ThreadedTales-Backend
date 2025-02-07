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
        const jwtSecret = process.env.JWT_SECRET;

        const expiresIn = process.env.JWT_EXPIRES_IN
            ? /^\d+$/.test(process.env.JWT_EXPIRES_IN)
                ? parseInt(process.env.JWT_EXPIRES_IN, 10)
                : process.env.JWT_EXPIRES_IN
            : "1h";

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            jwtSecret as string,
            { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
        );

        res.status(200).json({
            user: {
                user
            },
            accessToken: accessToken
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error during signup" });
    }
}

export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
    const { email, password, otp } = req.body;

    try {

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "password is incorrect" });
        }
        const jwtSecret = process.env.JWT_SECRET;

        const expiresIn = process.env.JWT_EXPIRES_IN
            ? /^\d+$/.test(process.env.JWT_EXPIRES_IN)
                ? parseInt(process.env.JWT_EXPIRES_IN, 10)
                : process.env.JWT_EXPIRES_IN
            : "1h";

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            jwtSecret as string,
            { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
        );


        if (user.otp === otp) {
            return res.status(200).json({
                user: {
                    userId: user.id,
                    email: user.email,
                    accessToken: accessToken,
                },
            });
        }
        return res.status(400).json({ error: "Invalid otp" });
    }
    catch (error: any) {
        console.error("Error during OTP verification:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

export const login = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                stories: {
                    include: {
                        likes: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN
            ? /^\d+$/.test(process.env.JWT_EXPIRES_IN)
                ? parseInt(process.env.JWT_EXPIRES_IN, 10)
                : process.env.JWT_EXPIRES_IN
            : "1h";

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            jwtSecret as string,
            { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
        );

        // Map stories with total likes for easier processing
        const storiesWithLikeCount = user.stories.map(story => ({
            id: story.id,
            title: story.title,
            content: story.content,
            likeCount: story.likes.length,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
        }));

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                about: user.about,
                social: {
                    twitter: user.twitter,
                    facebook: user.facebook,
                    instagram: user.instagram,
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            stories: storiesWithLikeCount,
            accessToken: accessToken,
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Error during login" });
    }
};