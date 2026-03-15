import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { logger } from "@utils/logger";
import { authorizeUrls } from "@config/serviceRegistry";

export function verifyJWT(req: any, res: Response, next: NextFunction) {
  const path = req.originalUrl.split("?")[0];

  const isAuthorized = authorizeUrls.some(url => path.includes(url))

  // If the URL is in the list of authorized URLs, skip JWT verification  
  if (isAuthorized) {
    return next();
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    logger.error("Invalid token");
    return res.status(401).json({ error: "Invalid token" });
  }
}