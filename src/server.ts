import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";

import { env } from "@config/env";
import { logger } from "@utils/logger";

import gatewayRouter from "@routes/gatewayRouter";

import { services } from "@config/serviceRegistry";

import { createServiceProxy } from "@services/proxyService";
import { wsProxy } from "@services/wsProxy";

import { verifyJWT } from "@middleware/verifyJWT";

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
// BODY PARSING
// Skip proxied routes
// ==========================

app.use((req, res, next) => {

  const skipBodyParsing =
    req.path.startsWith("/api/")
    || req.path.startsWith("/gateway")
    || req.path.startsWith("/health");

  if (skipBodyParsing) {
    return next();
  }

  express.json({
    limit: "50mb"
  })(req, res, () => {

    express.urlencoded({
      extended: true,
      limit: "50mb"
    })(req, res, next);
  });
});


// ==========================
// GATEWAY ROUTES
// ==========================

app.use(gatewayRouter);


// ==========================
// WEBSOCKET PROXY
// ==========================

app.use("/gateway", wsProxy);


// ==========================
// DYNAMIC SERVICE PROXIES
// ==========================

for (const service of services) {

  logger.info(
    `Proxy mounted: ${service.prefix} -> ${service.target}`
  );

  app.use(
    service.prefix,
    verifyJWT,
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
// WEBSOCKET UPGRADE
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