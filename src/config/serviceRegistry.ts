import { env } from "@config/env";

export type Service = {
  prefix: string;
  target: string;
};

export const services: Service[] = [
  { prefix: "/api/v1", target: env.CHATFUSIONX_SERVICE},
  // { prefix: "/v1/group", target: env.USER_SERVICE},
  // { prefix: "/v1/private", target: env.USER_SERVICE},

  // { prefix: "/v1/chatfusionx-ai", target: env.AI_SERVICE},

  // { prefix: "/v1/text-extraction", target: env.FILE_SERVICE},
  // { prefix: "/v1/pdf-to-png", target: env.FILE_SERVICE}
];

export const authorizeUrls: string[] = [
  env.SERVER_STATUS_URL,
  env.USER_VALIDATE_URL,
  env.GOOGLE_AUTH_URL,
  env.PASS_RESET_URL,
  env.OTP_SEND_URL,
  env.OTP_VERIFY_URL
]