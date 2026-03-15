import express from "express";
import { getLandingMeta } from "../controllers/metaController.js";

const router = express.Router();

router.get("/landing", getLandingMeta);

export default router;

