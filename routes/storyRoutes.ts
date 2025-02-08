import express from "express";
import { getStories,createStory,getStoryById,getUserStories } from "../controllers/storiesController";
import { create } from "../controllers/transactionController";
const storyRoutes = express.Router();

storyRoutes.get("/stories",getStories);
storyRoutes.post("/create",create);
storyRoutes.get("/getStory/:id",getStoryById);
storyRoutes.post("/getUserStories",getUserStories);

export default storyRoutes;