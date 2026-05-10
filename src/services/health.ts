import { Response } from "express";

import { env } from "@config/env";

async function checkService(
  url: string,
  timeout: number
) {

  try {

    const response = await fetch(url, {

      signal: AbortSignal.timeout(timeout),

      headers: {
        Accept: "application/json"
      }
    });

    // Service reachable but rate limited
    if (response.status === 429) {

      return {
        status: "RATE_LIMITED"
      };
    }

    if (!response.ok) {

      return {
        status: "DOWN",
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();

    return {
      status: "UP",
      data
    };

  } catch (error: any) {

    return {

      status:
        error.name === "TimeoutError"
          ? "TIMEOUT"
          : "UNREACHABLE",

      error: error.message
    };
  }
}

export async function checkHealth(
  req: any,
  res: Response
) {

  // Wake background services
  // Do not wait for response

  fetch(
    `${env.PDF_TO_PNG_SERVICE}/health`,
    {
      signal: AbortSignal.timeout(10000)
    }
  ).catch(() => {});

  fetch(
    `${env.TEXT_EXTRACTION_SERVICE}/health`,
    {
      signal: AbortSignal.timeout(10000)
    }
  ).catch(() => {});

  const start = Date.now();

  // Wait only for main service
  const mainService =
    await checkService(
      `${env.CHATFUSIONX_SERVICE}/api/v1/health`,
      15000
    );

  const responseTime =
    Date.now() - start;

  return res.status(200).json({

    gateway: "UP",

    timestamp:
      new Date().toISOString(),

    services: [

      {
        service: "chatfusionx-service",

        status: mainService.status,

        responseTime: `${responseTime}ms`,

        ...(mainService.data && {
          data: mainService.data
        }),

        ...(mainService.error && {
          error: mainService.error
        })
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
}