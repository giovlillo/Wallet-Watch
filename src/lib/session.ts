import "server-only";
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(secretKey);

if (!secretKey) {
  throw new Error("AUTH_SECRET environment variable is not set. Please add it to your .env file.");
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // Extend session to 8 hours
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    // Catches expired tokens or invalid tokens
    console.log("Failed to verify session:", error);
    return null;
  }
}
