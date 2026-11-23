/**
 * Strict Schema Enforcement Layer
 * Philosophy: Every building / city payload must pass BuildingSchema / CitySchema.
 * loadCity() is the ONLY approved entry point.
 */

const APPROVED_ZONES = new Set([
  "DISC_CORE",
  "PORTAL",
  "ISO_SECTOR",
  "END_OF_LINE_CLUB",
  "GRID_PERIMETER"
]);

export function validateBuilding(raw, index = 0) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError(`[BuildingSchema] Entry #${index} must be a non-null object.`);
  }
  const { id, name, zone, height, position, energyOutput, vectorSignature } = raw;

  if (typeof id !== "string" || !/^[a-z0-9-_]{3,64}$/i.test(id)) {
    throw new Error(`[BuildingSchema] Invalid building id at index ${index}.`);
  }
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new Error(`[BuildingSchema] Invalid building name for '${id}'.`);
  }
  if (!APPROVED_ZONES.has(zone)) {
    throw new Error(`[BuildingSchema] Unapproved zone '${zone}' on '${id}'.`);
  }
  if (typeof height !== "number" || !Number.isFinite(height) || height <= 0 || height > 2000) {
    throw new Error(`[BuildingSchema] Out-of-bounds height on '${id}'.`);
  }
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number" ||
    typeof position.z !== "number"
  ) {
    throw new Error(`[BuildingSchema] Invalid 3D coordinates on '${id}'.`);
  }
  if (typeof energyOutput !== "number" || energyOutput < 0) {
    throw new Error(`[BuildingSchema] Invalid energyOutput on '${id}'.`);
  }
  if (!Array.isArray(vectorSignature) || vectorSignature.length !== 12 || !vectorSignature.every(Number.isFinite)) {
    throw new Error(`[BuildingSchema] '${id}' requires a 12-dimensional numeric vectorSignature.`);
  }

  return Object.freeze({
    id,
    name: name.trim(),
    zone,
    height,
    position: Object.freeze({ x: position.x, y: position.y, z: position.z }),
    energyOutput,
    vectorSignature: Object.freeze([...vectorSignature])
  });
}

export function validateCity(rawCity) {
  if (!rawCity || typeof rawCity !== "object" || Array.isArray(rawCity)) {
    throw new TypeError("[CitySchema] City payload must be an object.");
  }

  const { cityId, gridVersion, discTelemetry, buildings } = rawCity;

  if (typeof cityId !== "string" || cityId.trim().length === 0) {
    throw new Error("[CitySchema] Missing cityId.");
  }
  if (typeof gridVersion !== "string" || !/^v\d+\.\d+\.\d+$/.test(gridVersion)) {
    throw new Error("[CitySchema] gridVersion must match semver vX.Y.Z.");
  }
  if (
    !discTelemetry ||
    discTelemetry.driveId !== 14 ||
    discTelemetry.status !== 2 ||
    discTelemetry.code !== 3 ||
    !["SEQUENTIAL", "RANDOM"].includes(discTelemetry.sortMode)
  ) {
    throw new Error("[CitySchema] DISC telemetry failed invariants (Drive=14, Status=2, Code=3).");
  }
  if (!Array.isArray(buildings) || buildings.length === 0) {
    throw new Error("[CitySchema] City must contain at least one validated building.");
  }

  const seenIds = new Set();
  const validatedBuildings = buildings.map((b, idx) => {
    const clean = validateBuilding(b, idx);
    if (seenIds.has(clean.id)) {
      throw new Error(`[CitySchema] Duplicate building id '${clean.id}'.`);
    }
    seenIds.add(clean.id);
    return clean;
  });

  return Object.freeze({
    cityId: cityId.trim(),
    gridVersion,
    schemaValidated: true,
    validatedAt: new Date().toISOString(),
    discTelemetry: Object.freeze({ ...discTelemetry }),
    buildings: Object.freeze(validatedBuildings)
  });
}

/**
 * loadCity() - The ONLY approved entry point for hydrating Grid city state.
 */
export function loadCity(rawPayload) {
  const parsed = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  return validateCity(parsed);
}
