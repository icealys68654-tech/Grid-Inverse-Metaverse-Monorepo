import { DiscRegistry } from "../../../packages/iso-discs-cis/src/registry.js";
import { createISODiscSystem } from "../../../packages/iso-discs-cis/src/index.js";
import { DiscMode, SortMode } from "../../../packages/iso-discs-cis/src/model.js";

const registry = new DiscRegistry();

function send(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64 * 1024) throw new Error("Request body exceeds 64 KB");
  }
  return JSON.parse(body || "{}");
}

export async function handleISODiscRequest(req, res, url) {
  if (url.pathname === "/api/iso-discs" && req.method === "GET") {
    send(res, 200, await registry.list());
    return true;
  }

  if (url.pathname === "/api/iso-discs" && req.method === "POST") {
    const record = await readJson(req);
    const saved = await registry.upsert(record);
    send(res, 201, saved);
    return true;
  }

  if (url.pathname === "/api/iso-discs/run" && req.method === "POST") {
    const body = await readJson(req);
    if (!Array.isArray(body.values) || body.values.some(value => !Number.isFinite(value))) {
      send(res, 400, { error: "values must be an array of finite numbers" });
      return true;
    }
    if (body.values.length > 10000) {
      send(res, 413, { error: "Maximum input length is 10000 values" });
      return true;
    }
    const system = createISODiscSystem({
      sortMode: body.sortMode ?? SortMode.SEQUENTIAL,
      discMode: body.discMode ?? DiscMode.DUPLICATE
    });
    send(res, 200, system.run(body.values, body.seed));
    return true;
  }

  const match = url.pathname.match(/^\/api\/iso-discs\/([^/]+)$/);
  if (match && req.method === "DELETE") {
    const removed = await registry.remove(decodeURIComponent(match[1]));
    send(res, removed ? 200 : 404, { removed });
    return true;
  }

  return false;
}
