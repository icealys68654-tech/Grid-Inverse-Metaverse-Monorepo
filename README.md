Philosophy enforced Every building / city payload must pass Building Schema / Citi Schema. load City() is the only approved entry point. Frontend never trusts raw data; it only displays what the schema-validated API returns. The Disc Core image sits at the visual center — the crystalline form that anchors the Grid. The site is ready to run. All systems Are At A Go (Disc Core, Portal, ISOs, End of Line Club, etc.) for DISC(Drive ID = 14, Status = 2, Code = 3).SORT(Sequential Or Random Transfer)
Abstract Codebase Flatten*.*Files, Bind Vector Parse Phase for Workflow/Monorepo Placeholder Streamlining Umbrella CMAKE Github production ready .ZIP file for full-stack web app: C4 model (validation + diagram), smoke-probe (CI endpoint test), env-guard (.env linter)

# Grid Full-Stack Monorepo & Umbrella CMake Pipeline

Production-ready full-stack web application and monorepo toolkit enforcing strict schema boundaries (`BuildingSchema` / `CitySchema`) via `loadCity()`, a flattened `*.*` 12-dimensional Vector Parse Phase (`DISC(Drive ID=14, Status=2, Code=3)`), and integrated engineering tools.

## ISO DISCS CIS MVC

The `packages/iso-discs-cis` workspace adds a standalone MVC implementation:
- Model: immutable CIS values, disc modes, and duplicate/input/system-check behavior.
- Controller: sequential, pass-through output, and deterministic seeded random-test sorting.
- View: serializable ISO duplicate view.
- Math: sorting, duplicate detection, mean, population variance, standard deviation, normalization, and checksum.
- Registry: validated JSON records persisted with atomic temporary-file replacement.
- Browser console: open `/iso-discs` while the API gateway is running.

### Run

```bash
npm run dev
# Open http://localhost:4173/iso-discs

# Run the ISO DISCS CIS test suite
npm run iso-discs:test

# Run the complete validation gate
npm run ci:gate
```

The default CIS fixture is `code=3, id=2, status=0.14`. Registry records are stored in `packages/iso-discs-cis/data/discs.json`.
