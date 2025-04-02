import * as crypto from "crypto";

export function encrypt(text: string, secretKey: string, algorithm: string = "aes-256-cbc", ivLength: number = 16): string {
    try {
        const iv = crypto.randomBytes(ivLength);

        const key = crypto.createHash("sha256").update(secretKey).digest("base64").substring(0, 32);

        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = cipher.update(text, "utf8", "base64");
        encrypted += cipher.final("base64");

        const result = iv.toString("base64") + ":" + encrypted;

        return result;
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

export function decrypt(encryptedText: string, secretKey: string, algorithm: string = "aes-256-cbc"): string {
    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 2) {
            throw new Error("Invalid encrypted text format");
        }

        const iv = Buffer.from(parts[0], "base64");
        const encrypted = parts[1];

        const key = crypto.createHash("sha256").update(secretKey).digest("base64").substring(0, 32);

        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        let decrypted = decipher.update(encrypted, "base64", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}
