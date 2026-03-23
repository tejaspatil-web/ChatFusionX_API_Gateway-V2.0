import { env } from "@config/env";

export type Service = {
  prefix: string;
  target: string;
};

export const services: Service[] = [
  { prefix: "/api/v1", target: env.CHATFUSIONX_SERVICE},
  { prefix: "/api/pdf-to-png", target: env.PDF_TO_PNG_SERVICE},
  { prefix: "/api/text-extraction", target: env.TEXT_EXTRACTION_SERVICE}
];

export const authorizeUrls: string[] = [
  env.SERVER_STATUS_URL,
  env.USER_VALIDATE_URL,
  env.GOOGLE_AUTH_URL,
  env.PASS_RESET_URL,
  env.OTP_SEND_URL,
  env.OTP_VERIFY_URL
]