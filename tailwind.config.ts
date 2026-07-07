// The active Tailwind config lives in tailwind.config.mjs (imported directly by
// postcss.config.mjs). This thin re-export keeps editor tooling and the
// Tailwind CLI working from a single source of truth.
// @ts-ignore - config module has no type declarations
import config from "./tailwind.config.mjs";

export default config;
