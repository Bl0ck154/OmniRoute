import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [repoRoot, artifactPath, outputPath] = process.argv.slice(2);
if (!outputPath) throw new Error("usage: make-production-manifest.mjs repo artifact output");

const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const git = (...args) => execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();
const customRevision = Number(process.env.CUSTOM_REVISION || "1");
if (!Number.isInteger(customRevision) || customRevision < 1) {
  throw new Error(`invalid CUSTOM_REVISION: ${process.env.CUSTOM_REVISION}`);
}

const manifest = {
  schemaVersion: 2,
  package: "omniroute",
  version: pkg.version,
  upstreamVersion: pkg.version,
  sourceRepository: process.env.GITHUB_REPOSITORY || "Bl0ck154/OmniRoute",
  sourceRef: process.env.GITHUB_REF_NAME || "production",
  sourceCommit: git("rev-parse", "HEAD"),
  customRevision,
  artifact: path.basename(artifactPath),
  artifactSha256: sha256(artifactPath),
  nodeVersion: process.version,
  platform: "linux-x64",
  buildWorkflow: process.env.GITHUB_WORKFLOW || "local",
  buildRunId: process.env.GITHUB_RUN_ID || null,
  builtAt: new Date().toISOString()
};

writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
