import axios from "axios";
import { Response } from "express";
import { services } from "@config/serviceRegistry";
import { env } from "@config/env";
import { logger } from "@utils/logger";

export async function proxyRequest(req: any, res: Response) {
  const path = req.originalUrl.split("?")[0];
  const maxContentLength = 50 * 1024 * 1024;

  const service = services.find(
    s => path === s.prefix || path.startsWith(s.prefix + "/")
  );

  if (!service) {
    logger.error(`Service not found: ${path}`);
    return res.status(404).json({ error: "Service not found" });
  }

  const target = service.target + req.originalUrl;

  try {
    logger.info(`${req.method} ${req.originalUrl} -> ${target}`);

    const contentLength = Number(req.headers["content-length"] || 0);
    if (contentLength > maxContentLength) {
      logger.error(`Payload too large: ${contentLength}`);
      return res.status(413).json({ error: "Payload too large" });
    }

    const headers: any = {
      ...req.headers,
      "X-SERVICE-KEY": env.SERVICE_KEY
    };

    delete headers["host"];
    delete headers["content-length"];
    delete headers["connection"];

    const isBodyAllowed = !["GET", "HEAD"].includes(req.method);
    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");

    const response = await axios({
      method: req.method,
      url: target,
      headers,
      data: isBodyAllowed ? (isMultipart ? req : req.body) : undefined,
      responseType: "arraybuffer",
      maxContentLength,
      maxBodyLength: maxContentLength,
      timeout: 300000,
      validateStatus: () => true
    });

    logger.info(`Response ${response.status} from ${target}`);

    Object.entries(response.headers).forEach(([key, value]) => {
      if (value && key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value as any);
      }
    });

    const contentType = response.headers["content-type"] || "";

    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/pdf") ||
      contentType.includes("image")
    ) {
      logger.info(`Streaming binary response: ${contentType}`);
      return res.status(response.status).send(response.data);
    }

    const text = Buffer.from(response.data).toString("utf-8");

    try {
      const json = JSON.parse(text);
      return res.status(response.status).json(json);
    } catch {
      logger.error("Non-JSON response returned");
      return res.status(response.status).send(text);
    }

  } catch (err: any) {
    if (err.response) {
      let data = err.response.data;
      if (Buffer.isBuffer(data)) data = data.toString("utf-8");

      logger.error(`Upstream error ${err.response.status}: ${data}`);

      return res.status(err.response.status).send({
        error: "Upstream service error",
        details: data
      });
    }

    if (err.code === "ECONNABORTED") {
      logger.error("Gateway timeout");
      return res.status(504).json({ error: "Gateway timeout" });
    }

    if (err.request) {
      logger.error("Service unavailable");
      return res.status(503).json({ error: "Service unavailable" });
    }

    logger.error(`Gateway internal error: ${err.message}`);

    return res.status(500).json({ error: "Gateway internal error" });
  }
}