import { Request, Response } from 'express';
import prisma from '../DB/db.config';

export const getStories = async (req: Request, res: Response): Promise<void> => {
    try {
        const stories = await prisma.story.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        children: true,
                    },
                },
                createdBy: { select: { name: true } },
            },
        });

        res.status(200).json(stories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
};

export const createStory = async (req: Request, res: Response): Promise<void> => {
    const { title, content, parentId, userId } = req.body;

    try {
        const story = await prisma.story.create({
            data: {
                title,
                content,
                parentId,
                createdBy: { connect: { id: userId } },
            },
        });

        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create story' });
    }
};

export const getStoryById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        const story = await prisma.story.findUnique({
            where: { id },
            include: {
                children: {
                    include: {
                        children: true,
                    },
                },
                createdBy: { select: { name: true } },
            },
        });

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        res.status(200).json(story);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch story' });
    }
};

export const toggleLikeStory = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const existingLike = await prisma.like.findFirst({
            where: { storyId: id, userId },
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            return res.status(200).json({ message: 'Story unliked' });
        }

        
        await prisma.like.create({
            data: {
                storyId: id,
                userId,
            },
        });

        res.status(201).json({ message: 'Story liked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};
