import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] || "src/generated/epks");
const allowedExtensions = new Set([".ts", ".tsx", ".css", ".json", ".md"]);
const allowedPackages = new Set([
  "react",
  "next/image",
  "next/link",
  "gsap",
  "@gsap/react",
  "lucide-react",
]);
const forbiddenPatterns = [
  ["unsafe HTML", /\bdangerouslySetInnerHTML\b/],
  ["eval", /\beval\s*\(/],
  ["Function constructor", /\bnew\s+Function\s*\(/],
  ["dynamic import", /\bimport\s*\(/],
  ["CommonJS require", /\brequire\s*\(/],
  ["environment access", /\bprocess\.env\b/],
  ["child process", /(?:node:)?child_process/],
  ["filesystem access", /\b(?:node:)?fs(?:\/promises)?\b/],
  ["network fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
  ["sendBeacon", /\bsendBeacon\s*\(/],
  [
    "window navigation",
    /\b(?:window\.(?:location\.(?:href|assign|replace)|open)|location\.(?:href|assign|replace))\b/,
  ],
  ["direct document access", /\bdocument\./],
  ["browser storage", /\b(?:localStorage|sessionStorage|document\.cookie)\b/],
  ["script tag", /<script\b/i],
  ["embedded remote content", /<(?:iframe|embed|object)\b/i],
  ["form action", /(?:\bformAction\s*=|<form[^>]*\saction\s*=)/i],
  ["remote import", /(?:from\s+|import\s*\()["']https?:\/\//],
];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`EPK packages may not contain symbolic links: ${fullPath}`);
    }
    if (entry.isDirectory()) files.push(...(await collect(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function importedSpecifiers(source) {
  const specifiers = [];
  const expression = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(expression)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

const files = await collect(root);
if (files.length > 40) {
  console.error(`EPK package contains ${files.length} files; maximum is 40.`);
  process.exit(1);
}

let totalBytes = 0;
const errors = [];
for (const file of files) {
  const extension = path.extname(file);
  const relative = path.relative(process.cwd(), file);
  if (!allowedExtensions.has(extension)) {
    errors.push(`${relative}: unsupported file extension ${extension || "(none)"}`);
    continue;
  }
  const fileStat = await stat(file);
  totalBytes += fileStat.size;
  const source = await readFile(file, "utf8");

  for (const [label, pattern] of forbiddenPatterns) {
    if (
      label === "dynamic import" &&
      relative === "src/generated/epks/registry.ts"
    ) {
      continue;
    }
    if (pattern.test(source)) errors.push(`${relative}: forbidden ${label}`);
  }
  if ([".ts", ".tsx", ".css"].includes(extension) && /https?:\/\//i.test(source)) {
    errors.push(`${relative}: remote URL literals belong in the manifest, not executable code`);
  }
  for (const specifier of importedSpecifiers(source)) {
    if (specifier.startsWith(".")) {
      const resolved = path.resolve(path.dirname(file), specifier);
      if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
        errors.push(`${relative}: relative import escapes the generated EPK directory`);
      }
    } else if (!allowedPackages.has(specifier)) {
      errors.push(`${relative}: unauthorized dependency "${specifier}"`);
    }
  }
}

if (totalBytes > 750 * 1024) {
  errors.push(`EPK package is ${totalBytes} bytes; maximum is 768000.`);
}

if (errors.length > 0) {
  console.error("Generated EPK package failed validation:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Generated EPK package passed validation (${files.length} files, ${totalBytes} bytes).`,
);
