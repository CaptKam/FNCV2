// orval generates two parallel barrels: `generated/api.ts` exports
// zod schema objects (value + inferred type for each endpoint), and
// `generated/types/` exports the same names as plain TS types.
// Re-exporting both causes TS2308 "module has already exported a
// member named X" collisions. We re-export only from api.ts —
// consumers that need a type-only import should use
// `z.infer<typeof SchemaName>` on the exported zod schema. Today the
// only workspace consumer (api-server/routes/health.ts) imports
// HealthCheckResponse which lives in api.ts, so this narrowing is
// zero-impact. If you need to re-export specific types that DON'T
// live in api.ts (e.g. the handful of runtime enum consts in
// generated/types/*Status.ts), add them explicitly below.
export * from "./generated/api";
