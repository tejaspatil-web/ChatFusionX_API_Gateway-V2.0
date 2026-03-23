import axios from "axios";
import { Response } from "express";
import { env } from "@config/env";

export async function checkHealth(req: any, res: Response) {
const services = [
    { name: "chatfusionx-service", url: `${env.CHATFUSIONX_SERVICE}/api/v1/health` },
    { name: "pdf-to-png-service", url: `${env.PDF_TO_PNG_SERVICE}/health` },
    { name: "text-extraction-service", url: `${env.TEXT_EXTRACTION_SERVICE}/health` }
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await axios.get(service.url);
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