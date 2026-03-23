import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";

import { env } from "@config/env";
import { rateLimiter } from "@middleware/rateLimiter";
import gatewayRouter from "@routes/gatewayRouter";
import { logger } from "@utils/logger";
import { wsProxy } from "@services/wsProxy";

const app = express();

//Global middlewares
app.use(cors({
  origin: [env.FRONTEND_URL]
}));
app.use(helmet());
app.use(rateLimiter);

//WebSocket proxy
app.use("/gateway", wsProxy);

//Gateway routes
app.use(gatewayRouter);

const server = http.createServer(app);

server.on("upgrade", wsProxy.upgrade);

server.listen(env.PORT, () => {
  logger.info(`Gateway running on port ${env.PORT}`);
});