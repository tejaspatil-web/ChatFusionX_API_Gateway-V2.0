import dotenv from "dotenv";

dotenv.config({
  path: './.env',
  override: true,
  quiet: true
});

export const env = {
  //Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || '',

  // General
  PORT: Number(process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET || '',
  SERVICE_KEY: process.env.SERVICE_KEY || '',

  // Services
  CHATFUSIONX_SERVICE: process.env.CHATFUSIONX_SERVICE || '',
  WS_SERVICE: process.env.WS_SERVICE || '',
  PDF_TO_PNG_SERVICE: process.env.PDF_TO_PNG_SERVICE || '',
  TEXT_EXTRACTION_SERVICE: process.env.TEXT_EXTRACTION_SERVICE || '',

  // Auth-related URLs
  SERVER_STATUS_URL: process.env.SERVER_STATUS_URL || '',
  USER_VALIDATE_URL: process.env.USER_VALIDATE_URL || '',
  GOOGLE_AUTH_URL: process.env.GOOGLE_AUTH_URL || '',
  PASS_RESET_URL: process.env.PASS_RESET_URL || '',
  OTP_SEND_URL: process.env.OTP_SEND_URL || '',
  OTP_VERIFY_URL: process.env.OTP_VERIFY_URL || ''
};