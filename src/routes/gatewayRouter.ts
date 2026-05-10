import express from "express";

import { checkHealth } from "@services/health";

const router = express.Router();

router.get("/health", checkHealth);

export default router;