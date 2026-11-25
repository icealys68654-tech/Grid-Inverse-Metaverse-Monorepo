import fs from "node:fs/promises";
import path from "node:path";
import { ISODiscCIS } from "./model.js";

export class DiscRegistry {
  constructor(filePath = new URL("../data/discs.json", import.meta.url)) {
    this.filePath = filePath instanceof URL ? filePath : path.resolve(filePath);
  }
  async list() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const records = JSON.parse(raw);
      if (!Array.isArray(records)) throw new Error("Registry must contain a JSON array");
      return records.map(record => this.#validate(record));
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }
  async get(id) {
    return (await this.list()).find(record => record.id === String(id)) ?? null;
  }
  async upsert(record) {
    const validated = this.#validate(record);
    const records = await this.list();
    const index = records.findIndex(item => item.id === validated.id);
    if (index < 0) records.push(validated);
    else records[index] = validated;
    await this.#write(records);
    return validated;
  }
  async remove(id) {
    const records = await this.list();
    const filtered = records.filter(record => record.id !== String(id));
    if (filtered.length === records.length) return false;
    await this.#write(filtered);
    return true;
  }
  #validate(record) {
    if (!record || typeof record !== "object" || !String(record.id ?? "").trim()) {
      throw new TypeError("Each disc record requires a non-empty id");
    }
    const cis = new ISODiscCIS(record.cis ?? {});
    return {
      id: String(record.id),
      label: String(record.label ?? record.id),
      cis: { code: cis.code, id: cis.id, status: cis.status },
      updatedAt: record.updatedAt ?? new Date().toISOString()
    };
  }
  async #write(records) {
    const target = this.filePath instanceof URL ? this.filePath : path.resolve(this.filePath);
    const directory = path.dirname(target);
    await fs.mkdir(directory, { recursive: true });
    const temp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(temp, `${JSON.stringify(records, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fs.rename(temp, target);
  }
}
