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

  const start = Date.now();

  const mainService =
    await checkService(
      `${env.CHATFUSIONX_SERVICE}/health`,
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
      }
    ]
  });
}