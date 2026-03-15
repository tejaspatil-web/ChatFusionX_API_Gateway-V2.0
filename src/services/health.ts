import axios from "axios";
import { Response } from "express";
import { env } from "@config/env";

export async function checkHealth(req: any, res: Response) {
const services = [
    { name: "user-service", url: `${env.USER_SERVICE}/health` },
    { name: "ai-service", url: `${env.AI_SERVICE}/health` },
    { name: "file-service", url: `${env.FILE_SERVICE}/health` }
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await axios.get(service.url, { timeout: 3000 });
        return {
          service: service.name,
          status: "UP",
          data: response.data
        };
      } catch (error) {
        return {
          service: service.name,
          status: "DOWN"
        };
      }
    })
  );

  res.json({
    gateway: "UP",
    services: results
  });
}