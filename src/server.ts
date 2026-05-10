import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";

import { env } from "@config/env";
import { logger } from "@utils/logger";

import { services } from "@config/serviceRegistry";
import { createServiceProxy } from "@services/proxyService";
import { wsProxy } from "@services/wsProxy";

const app = express();

const PORT = process.env.PORT || env.PORT || 3000;

app.disable("x-powered-by");


// ==========================
// TRUST PROXY
// ==========================
app.set("trust proxy", 1);

// ==========================
// SECURITY
// ==========================
app.use(helmet());


// ==========================
// CORS
// ==========================
app.use(cors({
  origin: [
    env.FRONTEND_URL,
    "http://localhost:4200"
  ],
  credentials: true
}));


// ==========================
// BODY PARSERS
// ==========================
app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));

// ==========================
// HEALTH CHECK
// ==========================
app.get("/health", (_, res) => {

  return res.status(200).json({
    gateway: "UP",
    timestamp: new Date().toISOString()
  });
});

// ==========================
// WEBSOCKET PROXY
// ==========================
app.use("/gateway", wsProxy);


// ==========================
// SERVICE PROXIES
// ==========================
for (const service of services) {

  logger.info(
    `Proxy mounted: ${service.prefix} -> ${service.target}`
  );

  app.use(
    service.prefix,
    createServiceProxy(service.prefix)
  );
}


// ==========================
// 404 HANDLER
// ==========================
app.use((req, res) => {

  logger.error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  return res.status(404).json({
    error: "Route not found"
  });
});

// ==========================
// HTTP SERVER
// ==========================
const server = http.createServer(app);

// ==========================
// WS UPGRADE
// ==========================
server.on("upgrade", wsProxy.upgrade);

// ==========================
// START SERVER
// ==========================
server.listen(Number(PORT), "0.0.0.0", () => {

  logger.info(
    `Gateway running on port ${PORT}`
  );
});