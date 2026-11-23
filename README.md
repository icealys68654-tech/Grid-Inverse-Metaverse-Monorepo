# Grid Full-Stack Monorepo & Umbrella CMake Pipeline

Production-ready full-stack web application and monorepo toolkit enforcing strict schema boundaries (`BuildingSchema` / `CitySchema`) via `loadCity()`, a flattened `*.*` 12-dimensional Vector Parse Phase (`DISC(Drive ID=14, Status=2, Code=3).SORT(...)`), and three integrated engineering tools:

1. **`packages/c4-model`**: Architecture-as-code validator and Mermaid/SVG C4 diagram generator.
2. **`packages/smoke-probe`**: CI/CD endpoint smoke-testing tool verifying status codes, headers, and schema-validated payloads.
3. **`packages/env-guard`**: Fast `.env` linter checking syntax errors, duplicate keys, missing values, and alphabetical key ordering.

## Quick Start

```bash
# 1. Run via CMake Umbrella
cmake -B build -S .
cmake --build build

# 2. Or run directly via Node/Python
npm run ci:gate
npm run dev
```
