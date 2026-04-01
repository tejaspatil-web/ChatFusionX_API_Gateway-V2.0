import axios, { AxiosRequestConfig } from "axios";
import { Response } from "express";
import { services } from "@config/serviceRegistry";
import { env } from "@config/env";
import { logger } from "@utils/logger";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function proxyRequest(req: any, res: Response) {
  const path = req.originalUrl.split("?")[0];

  const service = services.find(
    s => path === s.prefix || path.startsWith(s.prefix + "/")
  );

  if (!service) {
    return res.status(404).json({ error: "Service not found" });
  }

  const targetUrl = service.target + req.originalUrl;

  try {
    logger.info(`${req.method} ${req.originalUrl} → ${targetUrl}`);

    const contentLength = Number(req.headers["content-length"] || 0);
    if (contentLength > MAX_SIZE) {
      return res.status(413).json({ error: "Payload too large" });
    }

    const headers: Record<string, any> = {
      ...req.headers,
      "X-SERVICE-KEY": env.SERVICE_KEY
    };

    delete headers["host"];
    delete headers["content-length"];
    delete headers["connection"];

    const isBodyAllowed = !["GET", "HEAD"].includes(req.method);
    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");

    const axiosConfig: AxiosRequestConfig = {
      method: req.method as any,
      url: targetUrl,
      headers,
      data: isBodyAllowed ? req.body : undefined,
      responseType: isMultipart ? "stream" : "arraybuffer",
      maxContentLength: MAX_SIZE,
      maxBodyLength: MAX_SIZE,
      timeout: 300000,
      validateStatus: () => true
    };

    const response = await axios(axiosConfig);

    Object.entries(response.headers).forEach(([key, value]) => {
      if (value && key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value as any);
      }
    });

    if (isMultipart || response.request?.res?.responseUrl?.includes("download")) {
      res.status(response.status);
      response.data.pipe(res);
      return;
    }

    let responseData: any = response.data;
    const contentType = response.headers["content-type"] || "";

    if (Buffer.isBuffer(response.data)) {
      const text = response.data.toString("utf-8");

      if (contentType.includes("application/json")) {
        try {
          responseData = JSON.parse(text);
        } catch (err) {
          logger.error("JSON parse failed from upstream");
          logger.error(text);
          responseData = text;
        }
      } else {
        responseData = text;
      }
    }

    return res.status(response.status).send(responseData);

  } catch (err: any) {
    if (err.response) {
      let data = err.response.data;

      if (Buffer.isBuffer(data)) {
        data = data.toString("utf-8");
      }

      logger.error(`Upstream Error: ${err.response.status}`);
      logger.error(data);

      return res.status(err.response.status).send({
        error: "Upstream service error",
        details: data
      });
    }

    if (err.code === "ECONNABORTED") {
      logger.error("Timeout error");
      return res.status(504).json({ error: "Gateway timeout" });
    }

    if (err.request) {
      logger.error("Service unreachable");
      return res.status(503).json({ error: "Service unavailable" });
    }

    logger.error(`Gateway error:", ${err.message}`);

    return res.status(500).json({
      error: "Gateway internal error"
    });
  }
}