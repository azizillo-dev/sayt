import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { secretKey } from "@/lib/auth/token";

/**
 * An upload happens in two requests: the browser asks where to put the file,
 * stores it there itself, then asks the server to process what it stored.
 *
 * The ticket carries the agreed key and type between the two, signed, so the
 * second request cannot claim a different file than the first was granted.
 */

const ticketSchema = z.object({
  key: z.string().min(1).max(300),
  mimeType: z.string().min(1).max(100),
  fileName: z.string().max(200),
});
export type UploadTicket = z.infer<typeof ticketSchema>;

export async function signTicket(ticket: UploadTicket): Promise<string> {
  return new SignJWT(ticket).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30m").sign(secretKey());
}

export async function readTicket(token: unknown): Promise<UploadTicket | null> {
  if (typeof token !== "string") return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return ticketSchema.parse(payload);
  } catch {
    return null;
  }
}
