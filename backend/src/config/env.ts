import "dotenv/config";
import { z } from "zod";

// Centralized env validation — single source of truth for all
// process.env reads. Fails fast at boot with every issue listed,
// instead of scattered manual checks across lib/feature modules.
const emptyToUndefined = (v: unknown) => {
  if (typeof v !== "string") return v;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const envSchema = z
  .object({
    DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),

    JWT_SECRET: z
      .string()
      .trim()
      .min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).default("7d"),
    ),

    PORT: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).max(65535).default(3000),
    ),
    NODE_ENV: z.preprocess(
      emptyToUndefined,
      z.enum(["development", "production", "test"]).default("development"),
    ),

    APP_URL: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .url("APP_URL must be a valid URL")
        .default("http://localhost:3000"),
    ),

    SMTP_HOST: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional(),
    ),
    SMTP_PORT: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(65535).default(587),
    ),
    SMTP_SECURE: z.preprocess((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "boolean") return v;
      const s = String(v).trim().toLowerCase();
      if (s === "") return undefined;
      return s === "true" || s === "1" || s === "yes";
    }, z.boolean().default(false)),
    SMTP_USER: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional(),
    ),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).default("Social <no-reply@localhost>"),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !data.SMTP_HOST) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: "SMTP_HOST is required in production",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${details}`);
}

export const env = parsed.data;
export type Env = typeof env;
