import { Router } from "express";
import asyncHandler from "express-async-handler";
import { imageTextRenderController } from "../controllers/imageTextRenderController";

const imageTextRenderRoute = Router();

imageTextRenderRoute.get("/image-text-render", asyncHandler(imageTextRenderController));

export { imageTextRenderRoute };
