import { createProxyMiddleware } from "http-proxy-middleware";

import { services } from "@config/serviceRegistry";
import { env } from "@config/env";
import { logger } from "@utils/logger";

export function createServiceProxy(prefix: string) {

  const service = services.find(
    s => s.prefix === prefix
  );

  if (!service) {
    throw new Error(
      `Service not found for prefix ${prefix}`
    );
  }

  return createProxyMiddleware({
    target: service.target,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    secure: true,
    followRedirects: true,
    proxyTimeout: 300000,
    timeout: 300000,
    selfHandleResponse: false,
    on: {
      proxyReq: (proxyReq, req: any) => {

        proxyReq.setHeader(
          "X-SERVICE-KEY",
          env.SERVICE_KEY
        );

        logger.info(
          `${req.method} ${req.originalUrl} -> ${service.target}`
        );
      },

      proxyRes: (proxyRes, req: any) => {

        logger.info(
          `Response ${proxyRes.statusCode} -> ${req.method} ${req.originalUrl}`
        );
      },

      error: (err, req: any, res: any) => {

        logger.error(
          `Proxy error: ${err.message}`
        );

        if (!res.headersSent) {

          return res.status(503).json({
            error: "Service unavailable"
          });
        }
      }
    }
  });
}