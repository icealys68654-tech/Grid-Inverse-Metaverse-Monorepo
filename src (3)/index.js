#!/usr/bin/env node
import { fileURLToPath } from "node:url";

export async function runSmokeProbes(baseUrl) {
  const checks = [
    {
      name: "Health & DISC Status",
      path: "/api/health",
      expectedStatus: 200,
      validateBody: (json) => json.status === "AT_A_GO" && json.disc?.driveId === 14 && json.disc?.code === 3
    },
    {
      name: "Schema-Validated City Payload",
      path: "/api/city",
      expectedStatus: 200,
      validateBody: (json) => json.schemaValidated === true && Array.isArray(json.buildings) && json.buildings.length >= 4
    },
    {
      name: "C4 Model Live Endpoint",
      path: "/api/c4",
      expectedStatus: 200,
      validateBody: (json) => json.valid === true && typeof json.mermaid === "string"
    }
  ];

  const results = [];
  for (const check of checks) {
    const res = await fetch(`${baseUrl}${check.path}`);
    const contentType = res.headers.get("content-type") || "";
    if (res.status !== check.expectedStatus) {
      throw new Error(`[smoke-probe] ${check.name} failed status: got ${res.status}, expected ${check.expectedStatus}`);
    }
    if (!contentType.includes("application/json")) {
      throw new Error(`[smoke-probe] ${check.name} invalid content-type: ${contentType}`);
    }
    const body = await res.json();
    if (!check.validateBody(body)) {
      throw new Error(`[smoke-probe] ${check.name} payload assertion failed.`);
    }
    results.push({ name: check.name, status: res.status, ok: true });
  }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const targetIdx = process.argv.indexOf("--target");
  const target = targetIdx !== -1 ? process.argv[targetIdx + 1] : "http://localhost:4173";
  runSmokeProbes(target)
    .then((res) => {
      console.log("[smoke-probe] All CI endpoint checks passed:", JSON.stringify(res));
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
