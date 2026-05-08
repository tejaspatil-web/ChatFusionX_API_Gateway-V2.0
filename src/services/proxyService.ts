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

    const isMultipart =
      req.headers["content-type"]?.includes("multipart/form-data");

    const response = await fetch(target, {
      method: req.method,
      headers,
      body: isBodyAllowed
        ? (isMultipart
            ? (req as any)
            : JSON.stringify(req.body))
        : undefined,
      signal: AbortSignal.timeout(300000)
    });

    logger.info(`Response ${response.status} from ${target}`);

    response.headers.forEach((value, key) => {
      if (value && key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    const contentType =
      response.headers.get("content-type") || "";

    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/pdf") ||
      contentType.includes("image")
    ) {
      logger.info(`Streaming binary response: ${contentType}`);

      return res.status(response.status).send(data);
    }

    const text = data.toString("utf-8");

    try {
      const json = JSON.parse(text);

      return res.status(response.status).json(json);
    } catch {
      logger.error("Non-JSON response returned");

      return res.status(response.status).send(text);
    }

  } catch (err: any) {

    if (err.name === "TimeoutError") {
      logger.error("Gateway timeout");

      return res.status(504).json({
        error: "Gateway timeout"
      });
    }

    logger.error(`Gateway internal error: ${err.message}`);

    return res.status(503).json({
      error: "Service unavailable"
    });
  }
}