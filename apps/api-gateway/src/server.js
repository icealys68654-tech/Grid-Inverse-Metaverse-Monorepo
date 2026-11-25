import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCity } from "../../../packages/city-schema/src/index.js";
import { validateC4Architecture, generateMermaidDiagram } from "../../../packages/c4-model/src/index.js";
import { lintEnvContent } from "../../../packages/env-guard/src/index.js";
import { handleISODiscRequest } from "./iso-discs-routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../../..");
const PORT = Number(process.env.PORT || 4173);

const RAW_GRID_PAYLOAD = {
  cityId: "GRID-TRON-01",
  gridVersion: "v1.0.0",
  discTelemetry: {
    driveId: 14,
    status: 2,
    code: 3,
    sortMode: "SEQUENTIAL"
  },
  buildings: [
    {
      id: "disc-core-01",
      name: "Disc Core Crystalline Anchor",
      zone: "DISC_CORE",
      height: 512,
      position: { x: 0, y: 0, z: 0 },
      energyOutput: 999.9,
      vectorSignature: [0.91, 0.88, 0.74, 1.0, 0.12, 0.45, 0.45, 0.28, 0.42, 0.81, 0.63, 0.99]
    },
    {
      id: "portal-gate-01",
      name: "Portal Extraction Spire",
      zone: "PORTAL",
      height: 420,
      position: { x: 140, y: 0, z: -120 },
      energyOutput: 780.5,
      vectorSignature: [0.84, 0.76, 0.69, 0.98, 0.25, 0.31, 0.45, 0.28, 0.42, 0.52, 0.77, 0.64]
    },
    {
      id: "iso-sanctuary-01",
      name: "ISOs Algorithmic Sanctuary",
      zone: "ISO_SECTOR",
      height: 310,
      position: { x: -160, y: 0, z: -90 },
      energyOutput: 640.0,
      vectorSignature: [0.79, 0.81, 0.82, 0.95, 0.37, 0.67, 0.45, 0.28, 0.42, 0.33, 0.49, 0.88]
    },
    {
      id: "end-of-line-club",
      name: "End of Line Club",
      zone: "END_OF_LINE_CLUB",
      height: 275,
      position: { x: 110, y: 0, z: 155 },
      energyOutput: 520.2,
      vectorSignature: [0.72, 0.68, 0.61, 0.99, 0.50, 0.82, 0.45, 0.28, 0.42, 0.19, 0.91, 0.47]
    }
  ]
};

function getValidatedCityState(sortMode = "SEQUENTIAL") {
  const payload = structuredClone(RAW_GRID_PAYLOAD);
  payload.discTelemetry.sortMode = sortMode === "RANDOM" ? "RANDOM" : "SEQUENTIAL";
  return loadCity(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/iso-discs")) {
    try {
      const handled = await handleISODiscRequest(req, res, url);
      if (handled) return;
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ISO DISCS endpoint not found" }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (url.pathname === "/iso-discs") {
    const dashboard = fs.readFileSync(path.join(ROOT_DIR, "apps/web-frontend/iso-discs.html"), "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(dashboard);
    return;
  }

  if (url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "AT_A_GO",
      systems: ["Disc Core", "Portal", "ISOs", "End of Line Club"],
      disc: { driveId: 14, status: 2, code: 3 }
    }));
    return;
  }

  if (url.pathname === "/api/city") {
    try {
      const sortParam = (url.searchParams.get("sort") || "SEQUENTIAL").toUpperCase();
      const validatedCity = getValidatedCityState(sortParam);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(validatedCity));
    } catch (err) {
      res.writeHead(422, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ schemaValidated: false, error: err.message }));
    }
    return;
  }

  if (url.pathname === "/api/c4") {
    const spec = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "packages/c4-model/c4-architecture.json"), "utf8"));
    const validation = validateC4Architecture(spec);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...validation, spec, mermaid: generateMermaidDiagram(spec) }));
    return;
  }

  if (url.pathname === "/api/env-lint" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      const { content = "" } = JSON.parse(body || "{}");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(lintEnvContent(content)));
    });
    return;
  }

  if (url.pathname === "/api/vectors") {
    const vecFile = path.join(ROOT_DIR, "dist/manifest_vectors.jsonl");
    const lines = fs.existsSync(vecFile)
      ? fs.readFileSync(vecFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
      : [];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: lines.length, vectors: lines.slice(0, 25) }));
    return;
  }

  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, "apps/web-frontend/index.html"), "utf8");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(indexHtml);
});

server.listen(PORT, () => {
  console.log(`[Grid API Gateway] Schema-validated Grid online at http://localhost:${PORT}`);
});
