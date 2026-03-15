import axios from "axios";
import { Response } from "express";
import { services } from "@config/serviceRegistry";
import { env } from "@config/env";
import { logger } from "@utils/logger";

export async function proxyRequest(req: any, res: Response) {
  const path = req.originalUrl.split("?")[0];

  const service = services.find(
    s => path === s.prefix || path.startsWith(s.prefix + "/")
  );

  if (!service)
    return res.status(404).json({ error: "Service not found" });

  const target = service.target + req.originalUrl;

  try {
    logger.info(`${req.method} ${req.originalUrl} -> ${target}`);

    const response = await axios({
      method: req.method,
      url: target,
      headers: {
        Authorization: req.headers.authorization,
        "X-SERVICE-KEY": env.SERVICE_KEY,
        "X-GATEWAY": "gateway",
        "Content-Type": req.headers["content-type"]
      },
      data: req.method !== "GET" ? req.body : undefined,
      timeout: 15000
    });

    return res.status(response.status).send(response.data);
  } catch (err: any) {
    if (err.response)
      return res.status(err.response.status).json(err.response.data);

    if (err.request)
      return res.status(503).json({ error: "Service unavailable" });

    logger.error(`Gateway error: ${err.message}`);

    return res.status(500).json({ error: "Gateway internal error" });
  }
}