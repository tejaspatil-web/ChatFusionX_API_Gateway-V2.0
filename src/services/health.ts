import { Response } from "express";
import { env } from "@config/env";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkService(
  url: string,
  timeout: number,
  retries = 3
) {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      lastError = error;

      console.log(
        `[Health Check] Attempt ${attempt} failed for ${url}`
      );

      if (attempt < retries) {
        await sleep(5000);
      }
    }
  }

  throw lastError;
}

function wakeService(url: string) {
  fetch(url, {
    signal: AbortSignal.timeout(90000)
  }).catch(() => {});
}

export async function checkHealth(
  req: any,
  res: Response
) {

  // Wake optional services in background
  wakeService(`${env.PDF_TO_PNG_SERVICE}/health`);

  wakeService(`${env.TEXT_EXTRACTION_SERVICE}/health`);

  try {
    const start = Date.now();

    // Wait only for main service
    const data = await checkService(
      `${env.CHATFUSIONX_SERVICE}/api/v1/health`,
      90000
    );

    const time = Date.now() - start;

    return res.json({
      gateway: "UP",
      timestamp: new Date().toISOString(),
      services: [
        {
          service: "chatfusionx-service",
          status: "UP",
          responseTime: `${time}ms`,
          data
        },
        {
          service: "pdf-to-png-service",
          status: "WAKING_IN_BACKGROUND"
        },
        {
          service: "text-extraction-service",
          status: "WAKING_IN_BACKGROUND"
        }
      ]
    });

  } catch (error: any) {

    return res.status(503).json({
      gateway: "DOWN",
      services: [
        {
          service: "chatfusionx-service",
          status:
            error.name === "TimeoutError"
              ? "TIMEOUT (SLEEPING)"
              : "UNREACHABLE",
          error: error.message
        }
      ]
    });
  }
}