import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "lightmeet_admin";
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "saidh";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "LightMeet@123";
const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-lightmeet-change-this-secret";

type SessionPayload = {
  role: "admin";
  username: string;
  expiresAt: number;
  purpose?: "session" | "signaling";
};

export function validateAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createAdminSession() {
  const payload: SessionPayload = {
    role: "admin",
    username: ADMIN_USERNAME,
    expiresAt: Date.now() + 1000 * 60 * 60 * 12,
    purpose: "session",
  };
  return encodeSignedPayload(payload);
}

export function createAdminSignalToken() {
  const payload: SessionPayload = {
    role: "admin",
    username: ADMIN_USERNAME,
    expiresAt: Date.now() + 1000 * 60 * 10,
    purpose: "signaling",
  };
  return encodeSignedPayload(payload);
}

function encodeSignedPayload(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSession(token?: string) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const isValid = safeEqual(signature, expected);
  if (!isValid) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (payload.role !== "admin" || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("base64url");
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}
