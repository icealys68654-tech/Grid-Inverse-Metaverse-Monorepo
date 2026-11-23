#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function lintEnvContent(content) {
  const issues = [];
  const lines = content.split(/\r?\n/);
  const seenKeys = new Map();
  const activeKeys = [];

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      issues.push({ line: lineNum, rule: "SYNTAX_ERROR", message: "Missing '=' assignment operator." });
      return;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      issues.push({ line: lineNum, rule: "INVALID_KEY", message: `Key '${key}' must be UPPER_SNAKE_CASE.` });
    }
    if (seenKeys.has(key)) {
      issues.push({ line: lineNum, rule: "DUPLICATE_KEY", message: `Duplicate key '${key}' (first seen on line ${seenKeys.get(key)}).` });
    } else {
      seenKeys.set(key, lineNum);
      activeKeys.push({ key, line: lineNum });
    }
    if (val.length === 0) {
      issues.push({ line: lineNum, rule: "MISSING_VALUE", message: `Key '${key}' has an empty value.` });
    }
  });

  for (let i = 1; i < activeKeys.length; i++) {
    if (activeKeys[i].key.localeCompare(activeKeys[i - 1].key) < 0) {
      issues.push({
        line: activeKeys[i].line,
        rule: "UNORDERED_KEY",
        message: `Key '${activeKeys[i].key}' is out of alphabetical order after '${activeKeys[i - 1].key}'.`
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const targetFile = path.resolve(process.cwd(), process.argv[2] || ".env.example");
  const raw = fs.readFileSync(targetFile, "utf8");
  const report = lintEnvContent(raw);
  if (!report.valid) {
    console.error(`[env-guard] Failed on ${targetFile}:`);
    for (const i of report.issues) {
      console.error(`  Line ${i.line} [${i.rule}]: ${i.message}`);
    }
    process.exit(1);
  }
  console.log(`[env-guard] Passed: ${path.basename(targetFile)} conforms to all rules.`);
}
