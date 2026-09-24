import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

const log = logger.child({ service: "mail" });

export function buildVerificationLink(token: string): string {
  return `${env.APP_URL}/verify-email?token=${token}`;
}

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

let transporter: Transporter | null = null;

// Lazy singleton — one connection pool per process. SMTP comes from env:
// SMTP_HOST (required), SMTP_PORT (default 587), SMTP_SECURE=true for
// port-465 style TLS, SMTP_USER/SMTP_PASS for auth (omit both for a local
// relay). Missing host fails fast so misconfig surfaces immediately.
function getTransporter(): Transporter {
  const host = env.SMTP_HOST;
  if (!host) throw new AppError("Mail not configured (SMTP_HOST missing)", 500);
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" }
        : undefined,
    });
  }
  return transporter;
}

// Reusable mail sender. Callers pass explicit `to` addresses (email is
// resolved from User by sendMailToUser). Sender defaults to MAIL_FROM,
// else a localhost placeholder.
export async function sendMail(input: SendMailInput): Promise<void> {
  if (!input.text && !input.html) {
    throw new AppError("Mail needs text or html body", 400);
  }
  const from = env.MAIL_FROM;
  await getTransporter().sendMail({ from, ...input });
}

// Send a mail to a specific user. Resolves the user's email from the
// database; no-op if the user has no email or does not exist.
export async function sendMailToUser(
  userId: string,
  input: Omit<SendMailInput, "to">,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;
  await sendMail({ to: user.email, ...input });
}

// --- Dedicated per-type email wrappers ---

export async function sendWelcomeVerificationEmail(
  userId: string,
  username: string,
  token: string,
): Promise<void> {
  const link = buildVerificationLink(token);
  if (!env.SMTP_HOST && env.NODE_ENV !== "production") {
    log.warn({ userId, link }, "SMTP not configured, welcome verification link logged for dev");
    return;
  }
  await sendMailToUser(userId, {
    subject: "Welcome to Social, verify your email",
    text: `Hi ${username}, welcome to our app! Verify your email by visiting: ${link}`,
    html: `<p>Hi ${username}, welcome to our app!</p><p>Verify your email by visiting: <a href="${link}">Verify Email</a></p>`,
  });
}

function resolveUsername(userId: string): Promise<string> {
  return prisma.user
    .findUnique({ where: { id: userId }, select: { username: true } })
    .then((u) => u?.username ?? userId);
}

export async function sendFriendRequestEmail(
  addresseeId: string,
  requesterId: string,
): Promise<void> {
  const name = await resolveUsername(requesterId);
  await sendMailToUser(addresseeId, {
    subject: `${name} sent you a friend request`,
    text: `${name} sent you a friend request`,
    html: `<p>${name} sent you a friend request</p>`,
  });
}

export async function sendFriendAcceptedEmail(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const name = await resolveUsername(addresseeId);
  await sendMailToUser(requesterId, {
    subject: `${name} accepted your friend request`,
    text: `${name} accepted your friend request`,
    html: `<p>${name} accepted your friend request</p>`,
  });
}

export async function sendPostLikeEmail(
  authorId: string,
  likerId: string,
): Promise<void> {
  const name = await resolveUsername(likerId);
  await sendMailToUser(authorId, {
    subject: `${name} liked your post`,
    text: `${name} liked your post`,
    html: `<p>${name} liked your post</p>`,
  });
}

export async function sendPostCommentEmail(
  authorId: string,
  commenterId: string,
): Promise<void> {
  const name = await resolveUsername(commenterId);
  await sendMailToUser(authorId, {
    subject: `${name} commented on your post`,
    text: `${name} commented on your post`,
    html: `<p>${name} commented on your post</p>`,
  });
}

export async function sendVerificationEmail(
  userId: string,
  token: string,
): Promise<void> {
  const link = buildVerificationLink(token);
  if (!env.SMTP_HOST && env.NODE_ENV !== "production") {
    log.warn({ userId, link }, "SMTP not configured, verification link logged for dev");
    return;
  }
  await sendMailToUser(userId, {
    subject: "Verify your email",
    text: `Verify your email by visiting: ${link}`,
    html: `<p>Verify your email by visiting: <a href="${link}">Verify Email</a></p>`,
  });
}
