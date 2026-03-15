import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from 'http'

import { env } from "@config/env";
import { rateLimiter } from "@middleware/rateLimiter";
import gatewayRouter from "@routes/gatewayRouter";
import { logger } from "@utils/logger";
import { wsProxy } from "@services/wsProxy";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(rateLimiter);

// Routes
app.use(gatewayRouter);

const server = http.createServer(app);

// websocket proxy route
app.use("/gateway", wsProxy);

// upgrade handler for websocket
server.on("upgrade", wsProxy.upgrade);

server.listen(env.PORT, () => {
  logger.info(`Gateway running on port ${env.PORT}`);
});