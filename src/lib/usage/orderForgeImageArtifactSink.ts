import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { resolveDataDir } from "../dataPaths";

const ARTIFACT_DIR_ENV = "OMNIROUTE_ETSY_IMAGE_ARTIFACT_DIR";
export const ORDER_FORGE_IMAGE_ARTIFACT_SCOPE = "image_artifact_retention";
const ARTIFACT_ID_HEADER = "x-etsytrello-artifact-id";
const ARTIFACT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SAFE_ID_PATTERN = /[^A-Za-z0-9._-]+/g;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_ENCODED_BYTES = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 8;
const RETENTION_MS = 72 * 60 * 60 * 1000;
const MAX_STORE_BYTES = 2 * 1024 * 1024 * 1024;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastCleanupAt = 0;

type HeaderSource =
  | Headers
  | Record<string, unknown>
  | { get?: (name: string) => string | null }
  | null
  | undefined;

export type OrderForgeImageArtifactCapture = {
  artifactId: string;
  correlationId: string;
};

export type StoredOrderForgeImageArtifact = {
  artifactId: string;
  correlationId: string;
  imageCallId: string;
  responseId: string;
  format: "png" | "jpeg" | "webp";
  sizeBytes: number;
  sha256: string;
  path: string;
};

type CaptureEligibilityInput = {
  apiKeyScopes?: readonly string[] | null;
  headers?: HeaderSource;
  correlationId?: string | null;
};

type PersistInput = {
  capture: OrderForgeImageArtifactCapture;
  responseBody: unknown;
  baseDir?: string;
  now?: number;
};

type CleanupOptions = {
  baseDir?: string;
  now?: number;
  retentionMs?: number;
  maxStoreBytes?: number;
};

function getHeader(headers: HeaderSource, name: string): string | null {
  if (!headers) return null;
  if (typeof (headers as { get?: unknown }).get === "function") {
    return (headers as { get: (headerName: string) => string | null }).get(name);
  }
  const record = headers as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === name && typeof value === "string") return value;
  }
  return null;
}

function normalizeArtifactId(headers: HeaderSource): string | null {
  const value = String(getHeader(headers, ARTIFACT_ID_HEADER) || "").trim();
  return ARTIFACT_ID_PATTERN.test(value) ? value : null;
}

function safeSegment(value: string, fallback: string): string {
  const normalized = value.replace(SAFE_ID_PATTERN, "-").replace(/^-+|-+$/g, "").slice(0, 128);
  return normalized || fallback;
}

function resolveArtifactDir(): string {
  const configured = String(process.env[ARTIFACT_DIR_ENV] || "").trim();
  return configured || path.join(resolveDataDir(), "etsytrello-image-artifacts");
}

export function resolveOrderForgeImageArtifactCapture(
  input: CaptureEligibilityInput
): OrderForgeImageArtifactCapture | null {
  // Provider/model/route agnostic by design. Retention is a capability granted
  // to an API principal, not a hard-coded model/provider/endpoint or key id.
  if (!input.apiKeyScopes?.includes(ORDER_FORGE_IMAGE_ARTIFACT_SCOPE)) return null;
  const artifactId = normalizeArtifactId(input.headers);
  if (!artifactId) return null;

  return {
    artifactId,
    correlationId: safeSegment(
      String(input.correlationId || crypto.randomUUID()),
      crypto.randomUUID()
    ),
  };
}

function decodeValidatedImage(result: unknown): {
  data: Buffer;
  format: "png" | "jpeg" | "webp";
} | null {
  if (typeof result !== "string" || !result || result.length > MAX_ENCODED_BYTES) return null;
  if (result.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(result)) return null;

  let data: Buffer;
  try {
    data = Buffer.from(result, "base64");
  } catch {
    return null;
  }
  if (!data.length || data.length > MAX_IMAGE_BYTES) return null;
  if (data.toString("base64").replace(/=+$/, "") !== result.replace(/=+$/, "")) return null;

  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { data, format: "png" };
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { data, format: "jpeg" };
  }
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { data, format: "webp" };
  }
  return null;
}

function writeAtomic(filePath: string, data: Buffer | string): void {
  const tmpPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  let fd: number | null = null;
  try {
    fd = fs.openSync(tmpPath, "wx", 0o600);
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(tmpPath, filePath);
    fs.chmodSync(filePath, 0o600);
  } catch (error) {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {}
    }
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {}
    throw error;
  }
}

function listAttemptDirectories(baseDir: string): Array<{
  path: string;
  mtimeMs: number;
  sizeBytes: number;
}> {
  if (!fs.existsSync(baseDir)) return [];
  const attempts: Array<{ path: string; mtimeMs: number; sizeBytes: number }> = [];
  for (const dateEntry of fs.readdirSync(baseDir, { withFileTypes: true })) {
    if (!dateEntry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(dateEntry.name)) continue;
    const datePath = path.join(baseDir, dateEntry.name);
    for (const attemptEntry of fs.readdirSync(datePath, { withFileTypes: true })) {
      if (!attemptEntry.isDirectory() || attemptEntry.isSymbolicLink()) continue;
      const attemptPath = path.join(datePath, attemptEntry.name);
      let sizeBytes = 0;
      let mtimeMs = 0;
      for (const fileEntry of fs.readdirSync(attemptPath, { withFileTypes: true })) {
        if (!fileEntry.isFile() || fileEntry.isSymbolicLink()) continue;
        const stat = fs.statSync(path.join(attemptPath, fileEntry.name));
        sizeBytes += stat.size;
        mtimeMs = Math.max(mtimeMs, stat.mtimeMs);
      }
      attempts.push({ path: attemptPath, mtimeMs, sizeBytes });
    }
  }
  return attempts;
}

export function cleanupOrderForgeImageArtifacts(options: CleanupOptions = {}): {
  deletedAttempts: number;
  remainingBytes: number;
} {
  const baseDir = options.baseDir || resolveArtifactDir();
  const now = options.now ?? Date.now();
  const retentionMs = options.retentionMs ?? RETENTION_MS;
  const maxStoreBytes = options.maxStoreBytes ?? MAX_STORE_BYTES;
  let deletedAttempts = 0;
  let attempts = listAttemptDirectories(baseDir);

  for (const attempt of attempts) {
    if (attempt.mtimeMs > 0 && now - attempt.mtimeMs > retentionMs) {
      fs.rmSync(attempt.path, { recursive: true, force: true });
      deletedAttempts += 1;
    }
  }

  attempts = listAttemptDirectories(baseDir).sort((left, right) => left.mtimeMs - right.mtimeMs);
  let remainingBytes = attempts.reduce((total, attempt) => total + attempt.sizeBytes, 0);
  for (const attempt of attempts) {
    if (remainingBytes <= maxStoreBytes) break;
    fs.rmSync(attempt.path, { recursive: true, force: true });
    remainingBytes -= attempt.sizeBytes;
    deletedAttempts += 1;
  }

  if (fs.existsSync(baseDir)) {
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
      const datePath = path.join(baseDir, entry.name);
      if (fs.readdirSync(datePath).length === 0) fs.rmdirSync(datePath);
    }
  }
  return { deletedAttempts, remainingBytes: Math.max(0, remainingBytes) };
}

function maybeCleanup(baseDir: string, now: number): void {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  cleanupOrderForgeImageArtifacts({ baseDir, now });
}

export function persistOrderForgeImageArtifacts(input: PersistInput): StoredOrderForgeImageArtifact[] {
  const response =
    input.responseBody && typeof input.responseBody === "object" && !Array.isArray(input.responseBody)
      ? (input.responseBody as Record<string, unknown>)
      : null;
  const responseOutput = response?.output;
  const imageData = response?.data;
  const output = Array.isArray(responseOutput)
    ? responseOutput
    : Array.isArray(imageData)
      ? imageData.map((item, index) => {
          const record =
            item && typeof item === "object" && !Array.isArray(item)
              ? (item as Record<string, unknown>)
              : {};
          const dataUrl = typeof record.url === "string" ? record.url : "";
          const dataUrlMatch = dataUrl.match(/^data:image\/(?:png|jpeg|webp);base64,(.+)$/i);
          return {
            id: "image-" + String(index + 1),
            type: "image_generation_call",
            result:
              typeof record.b64_json === "string"
                ? record.b64_json
                : dataUrlMatch?.[1] || "",
          };
        })
      : [];
  if (output.length === 0) return [];

  const now = input.now ?? Date.now();
  const baseDir = input.baseDir || resolveArtifactDir();
  maybeCleanup(baseDir, now);
  fs.mkdirSync(baseDir, { recursive: true, mode: 0o700 });
  fs.chmodSync(baseDir, 0o700);

  const createdAt = new Date(now).toISOString();
  const dateDir = createdAt.slice(0, 10);
  const attemptId = safeSegment(input.capture.correlationId, crypto.randomUUID());
  const attemptDir = path.join(baseDir, dateDir, attemptId);
  fs.mkdirSync(attemptDir, { recursive: true, mode: 0o700 });
  fs.chmodSync(path.join(baseDir, dateDir), 0o700);
  fs.chmodSync(attemptDir, 0o700);

  const created = Number(response?.created || 0);
  const responseId = safeSegment(
    String(response?.id || (created > 0 ? "image-response:" + String(created) : "")),
    "unknown-response"
  );
  const stored: StoredOrderForgeImageArtifact[] = [];

  try {
    for (const item of output) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const record = item as Record<string, unknown>;
      if (record.type !== "image_generation_call") continue;
      const decoded = decodeValidatedImage(record.result);
      if (!decoded) continue;

      const imageCallId = safeSegment(String(record.id || ""), `image-${stored.length + 1}`);
      const sha256 = crypto.createHash("sha256").update(decoded.data).digest("hex");
      const extension = decoded.format === "jpeg" ? "jpg" : decoded.format;
      const imagePath = path.join(attemptDir, `${imageCallId}-${sha256.slice(0, 16)}.${extension}`);
      writeAtomic(imagePath, decoded.data);
      stored.push({
        artifactId: input.capture.artifactId,
        correlationId: input.capture.correlationId,
        imageCallId,
        responseId,
        format: decoded.format,
        sizeBytes: decoded.data.length,
        sha256,
        path: imagePath,
      });
    }

    if (stored.length === 0) {
      fs.rmSync(attemptDir, { recursive: true, force: true });
      return [];
    }

    const metadata = {
      schemaVersion: 1,
      artifactId: input.capture.artifactId,
      correlationId: input.capture.correlationId,
      responseId,
      createdAt,
      expiresAt: new Date(now + RETENTION_MS).toISOString(),
      images: stored.map((item) => ({
        imageCallId: item.imageCallId,
        format: item.format,
        sizeBytes: item.sizeBytes,
        sha256: item.sha256,
        fileName: path.basename(item.path),
      })),
    };
    writeAtomic(path.join(attemptDir, "metadata.json"), JSON.stringify(metadata, null, 2));
    return stored;
  } catch (error) {
    fs.rmSync(attemptDir, { recursive: true, force: true });
    throw error;
  }
}

export async function drainOrderForgeImageArtifactStream(
  stream: ReadableStream<Uint8Array>
): Promise<void> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done } = await reader.read();
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}
