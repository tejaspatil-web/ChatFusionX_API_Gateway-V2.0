import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "@config/env";

export const wsProxy = createProxyMiddleware({
  target: env.WS_SERVICE,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "^/gateway": ""
  }
});