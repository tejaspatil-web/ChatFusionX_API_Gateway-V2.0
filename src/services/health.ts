import { Response } from "express";
import { env } from "@config/env";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function wakeService(url: string) {
  try {
    await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch {
    // Ignore wake-up errors
  }
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

      // wait before retry
      if (attempt < retries) {
        await sleep(5000);
      }
    }
  }

  throw lastError;
}

export async function checkHealth(
  req: any,
  res: Response
) {
  const services = [
    {
      name: "chatfusionx-service",
      url: `${env.CHATFUSIONX_SERVICE}/api/v1/health`,
      timeout: 90000
    },
    {
      name: "pdf-to-png-service",
      url: `${env.PDF_TO_PNG_SERVICE}/health`,
      timeout: 90000
    },
    {
      name: "text-extraction-service",
      url: `${env.TEXT_EXTRACTION_SERVICE}/health`,
      timeout: 90000
    }
  ];

  // Wake all services in parallel
  await Promise.all(
    services.map(service =>
      wakeService(service.url)
    )
  );

  // Give Render time to wake services
  await sleep(15000);

  // Perform actual health checks in parallel
  const results = await Promise.all(
    services.map(async (service) => {
      const start = Date.now();

      try {
        const data = await checkService(
          service.url,
          service.timeout
        );

        const time = Date.now() - start;

        return {
          service: service.name,
          status: "UP",
          responseTime: `${time}ms`,
          data
        };

      } catch (error: any) {
        const time = Date.now() - start;

        return {
          service: service.name,
          status:
            error.name === "TimeoutError"
              ? "TIMEOUT (SLEEPING)"
              : "UNREACHABLE",
          responseTime: `${time}ms`,
          error: error.message
        };
      }
    })
  );

  res.json({
    gateway: "UP",
    timestamp: new Date().toISOString(),
    services: results
  });
}