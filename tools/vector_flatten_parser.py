#!/usr/bin/env python3
"""
Abstract Codebase Flatten *.* Files & 12-Dimensional Vector Parse Phase
Aligned with DISC(Drive ID = 14, Status = 2, Code = 3).SORT(Sequential | Random)
"""
import argparse
import hashlib
import json
import math
import os
import random
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "build", "dist", "__pycache__", ".venv"}


def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counts = [0] * 256
    for b in data:
        counts[b] += 1
    length = len(data)
    entropy = 0.0
    for c in counts:
        if c:
            p = c / length
            entropy -= p * math.log2(p)
    return round(entropy / 8.0, 6)


def compute_12d_vector(file_path: Path, rel_path: str, data: bytes, drive_id: int, status: int, code: int) -> list[float]:
    size = len(data)
    lines = data.count(b"\n") + 1 if size > 0 else 0
    digest = hashlib.sha256(rel_path.encode("utf-8") + data[:4096]).digest()
    entropy_norm = shannon_entropy(data)
    ascii_ratio = round(sum(1 for b in data[:2048] if 32 <= b <= 126 or b in (9, 10, 13)) / max(1, min(size, 2048)), 6)
    depth = min(1.0, rel_path.count("/") / 8.0)
    ext_hash = (sum(file_path.suffix.encode("utf-8")) % 256) / 255.0

    return [
        round(min(1.0, math.log1p(size) / 16.0), 6),
        round(min(1.0, math.log1p(lines) / 12.0), 6),
        entropy_norm,
        ascii_ratio,
        round(depth, 6),
        round(ext_hash, 6),
        round((drive_id % 32) / 31.0, 6),
        round((status % 8) / 7.0, 6),
        round((code % 8) / 7.0, 6),
        round(digest[0] / 255.0, 6),
        round(digest[1] / 255.0, 6),
        round(digest[2] / 255.0, 6),
    ]


def flatten_and_bind(root_dir: Path, out_file: Path, drive_id: int, status: int, code: int, sort_mode: str) -> dict:
    records = []
    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            full_path = Path(current_root) / fname
            rel_path = full_path.relative_to(root_dir).as_posix()
            raw = full_path.read_bytes()
            vec = compute_12d_vector(full_path, rel_path, raw, drive_id, status, code)
            records.append({
                "path": rel_path,
                "bytes": len(raw),
                "disc": {"driveId": drive_id, "status": status, "code": code, "sort": sort_mode.upper()},
                "vector12d": vec
            })

    if sort_mode.lower() == "random":
        rng = random.Random(drive_id * 1000 + status * 100 + code)
        rng.shuffle(records)
    else:
        records.sort(key=lambda r: r["path"])

    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open("w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec) + "\n")

    return {"count": len(records), "output": str(out_file), "sortMode": sort_mode.upper()}


def main():
    parser = argparse.ArgumentParser(description="Flatten *.* files into 12D JSONL vectors")
    parser.add_argument("--root", default=".")
    parser.add_argument("--out", default="dist/manifest_vectors.jsonl")
    parser.add_argument("--drive-id", type=int, default=14)
    parser.add_argument("--status", type=int, default=2)
    parser.add_argument("--code", type=int, default=3)
    parser.add_argument("--sort", choices=["sequential", "random"], default="sequential")
    args = parser.parse_args()

    summary = flatten_and_bind(Path(args.root).resolve(), Path(args.out).resolve(), args.drive_id, args.status, args.code, args.sort)
    print(f"[vector-parse] Flattened {summary['count']} files -> {summary['output']} ({summary['sortMode']})")


if __name__ == "__main__":
    main()
