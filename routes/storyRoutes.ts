import express from "express";
import { getStories,createStory,getStoryById } from "../controllers/storiesController";

const storyRoutes = express.Router();

storyRoutes.get("/stories",getStories);
storyRoutes.post("/create",createStory);
storyRoutes.get("/getStory",getStoryById);

export default storyRoutes;