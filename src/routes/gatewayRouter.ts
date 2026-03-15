import express from "express";
import { verifyJWT } from "@middleware/verifyJWT";
import { proxyRequest } from "@services/proxyService";
import { checkHealth } from "@services/health";

const router = express.Router();

router.use("/api", verifyJWT, proxyRequest);
router.get("/health", checkHealth);

export default router;