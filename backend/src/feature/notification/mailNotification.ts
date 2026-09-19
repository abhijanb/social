import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";

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
  const host = process.env.SMTP_HOST;
  if (!host) throw new AppError("Mail not configured (SMTP_HOST missing)", 500);
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
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
  const from = process.env.MAIL_FROM ?? "Social <no-reply@localhost>";
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

// Welcome email sent on registration. Username is passed directly (already known).
export async function sendWelcomeEmail(
  userId: string,
  username: string,
): Promise<void> {
  await sendMailToUser(userId, {
    subject: "Welcome to Social",
    text: `Hi ${username}, welcome to our app!`,
    html: `<p>Hi ${username}, welcome to our app!</p>`,
  }).catch(console.error);
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
  }).catch(console.error);
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
  }).catch(console.error);
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
  }).catch(console.error);
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
  }).catch(console.error);
}

export async function sendVerificationEmail(
  userId: string,
  token: string,
): Promise<void> {
  await sendMailToUser(userId, {
    subject: "Verify your email",
    text: `Verify your email by visiting: http://localhost:3000/user/verify-email?token=${token}`,
    html: `<p>Verify your email by visiting: <a href="http://localhost:3000/user/verify-email?token=${token}">Verify Email</a></p>`,
  }).catch(console.error);
}
