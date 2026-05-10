import { createProxyMiddleware } from "http-proxy-middleware";

import { env } from "@config/env";

export const wsProxy = createProxyMiddleware({
  target: env.WS_SERVICE,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  secure: false,
  followRedirects: true,
  proxyTimeout: 300000,
  timeout: 300000,
  pathRewrite: {
    "^/gateway": ""
  },

  on: {
    error: (err) => {

      console.error(
        "WebSocket Proxy Error:",
        err.message
      );
    }
  }
});