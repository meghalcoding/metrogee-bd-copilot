import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function getKey() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must be a 64-character hexadecimal key.");
  }
  return Buffer.from(raw, "hex");
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptSecret(payload: string) {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded] = payload.split(":");
  if (version !== VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
    throw new Error("Stored integration secret is invalid.");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
