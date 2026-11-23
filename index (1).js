#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SPEC = path.resolve(__dirname, "../c4-architecture.json");

export function validateC4Architecture(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object") {
    return { valid: false, errors: ["Architecture spec must be a JSON object."] };
  }
  if (!Array.isArray(spec.systems) || spec.systems.length === 0) {
    errors.push("C4 spec requires at least one System.");
  }
  if (!Array.isArray(spec.containers) || spec.containers.length === 0) {
    errors.push("C4 spec requires at least one Container.");
  }

  const nodeIds = new Set();
  for (const group of ["people", "systems", "containers", "components"]) {
    for (const item of spec[group] || []) {
      if (!item.id || !item.name) {
        errors.push(`Missing id or name in ${group}.`);
      } else if (nodeIds.has(item.id)) {
        errors.push(`Duplicate C4 element id '${item.id}'.`);
      } else {
        nodeIds.add(item.id);
      }
      if (item.parentId && !nodeIds.has(item.parentId)) {
        errors.push(`Element '${item.id}' references unknown parentId '${item.parentId}'.`);
      }
    }
  }

  for (const rel of spec.relationships || []) {
    if (!nodeIds.has(rel.from)) errors.push(`Relationship source '${rel.from}' does not exist.`);
    if (!nodeIds.has(rel.to)) errors.push(`Relationship target '${rel.to}' does not exist.`);
    if (!rel.protocol) errors.push(`Relationship '${rel.from} -> ${rel.to}' missing protocol.`);
  }

  return { valid: errors.length === 0, errors };
}

export function generateMermaidDiagram(spec) {
  const lines = ["graph TD"];
  for (const p of spec.people || []) {
    lines.push(`  ${p.id}["Person: ${p.name}"]`);
  }
  for (const s of spec.systems || []) {
    lines.push(`  ${s.id}[("System: ${s.name}")]`);
  }
  for (const c of spec.containers || []) {
    lines.push(`  ${c.id}["Container: ${c.name} (${c.tech || "runtime"})"]`);
  }
  for (const comp of spec.components || []) {
    lines.push(`  ${comp.id}("Component: ${comp.name}")`);
  }
  for (const rel of spec.relationships || []) {
    lines.push(`  ${rel.from} -->|"${rel.label} [${rel.protocol}]"| ${rel.to}`);
  }
  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const specPath = process.argv[3] || DEFAULT_SPEC;
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const result = validateC4Architecture(spec);
  if (!result.valid) {
    console.error("[c4-model] Validation FAILED:\n - " + result.errors.join("\n - "));
    process.exit(1);
  }
  const mermaid = generateMermaidDiagram(spec);
  const outDir = path.resolve(process.cwd(), "dist");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "architecture.mmd"), mermaid, "utf8");
  console.log("[c4-model] Architecture valid. Diagram written to dist/architecture.mmd");
}
