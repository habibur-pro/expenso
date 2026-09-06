import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const requireEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set. Add it to your .env file.`);
  }

  return value;
};

const baseURL = requireEnv("BETTER_AUTH_URL");
const secret = requireEnv("BETTER_AUTH_SECRET");
const googleClientId = requireEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

export const auth = betterAuth({
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});
