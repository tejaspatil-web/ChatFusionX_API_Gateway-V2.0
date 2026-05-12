import { Response } from "express";

export async function checkHealth(req: any, res: Response) {
  return res.status(200).json({
    status:"Server is awake and started."
  })
}