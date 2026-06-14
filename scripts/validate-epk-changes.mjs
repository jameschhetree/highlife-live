import process from "node:process";

let input = "";
for await (const chunk of process.stdin) input += chunk;

const files = input
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

const allowed = files.filter(
  (file) =>
    file.startsWith("src/generated/epks/") ||
    file === "src/generated/epks/registry.generated.ts",
);
const rejected = files.filter((file) => !allowed.includes(file));

if (files.length === 0) {
  console.error("No changed files were supplied to the EPK path guard.");
  process.exit(1);
}

if (rejected.length > 0) {
  console.error("EPK generation PR changed files outside its assigned directory:");
  for (const file of rejected) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`EPK path guard accepted ${files.length} changed file(s).`);
