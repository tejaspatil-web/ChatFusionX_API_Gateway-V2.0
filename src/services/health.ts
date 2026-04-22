import axios from "axios";
import { Response } from "express";
import { env } from "@config/env";

async function checkService(url: string, timeout: number) {
  try {
    // First attempt
    return await axios.get(url, { timeout });
  } catch (error: any) {
    // Retry once (same timeout)
    try {
      return await axios.get(url, { timeout });
    } catch (retryError: any) {
      throw retryError;
    }
  }
}

export async function checkHealth(req: any, res: Response) {
  const services = [
    {
      name: "chatfusionx-service",
      url: `${env.CHATFUSIONX_SERVICE}/api/v1/health`,
      timeout: 50000
    },
    {
      name: "pdf-to-png-service",
      url: `${env.PDF_TO_PNG_SERVICE}/health`,
      timeout: 5000
    },
    {
      name: "text-extraction-service",
      url: `${env.TEXT_EXTRACTION_SERVICE}/health`,
      timeout: 5000
    }
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const start = Date.now();

        const response = await checkService(
          service.url,
          service.timeout
        );

        const time = Date.now() - start;

        return {
          service: service.name,
          status: "UP",
          responseTime: `${time}ms`,
          data: response.data
        };
      } catch (error: any) {
        return {
          service: service.name,
          status:
            error.code === "ECONNABORTED"
              ? "TIMEOUT (SLEEPING)"
              : "UNREACHABLE"
        };
      }
    })
  );

  res.json({
    gateway: "UP",
    services: results
  });
}