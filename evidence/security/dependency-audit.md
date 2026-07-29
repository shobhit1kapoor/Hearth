# Dependency security audit

Audit date: 2026-07-29  
Commands: `npm audit --json` and `npm audit --omit=dev --json`

## Remediation completed

- Updated Next from 16.2.6 to 16.2.12, closing the current Next application advisories reported against the original lockfile.
- Updated React, React DOM, and React Server DOM Webpack from 19.2.6 to 19.2.8.
- Updated Vite from 8.0.13 to 8.1.5.
- Updated Wrangler from 4.92.0 to 4.115.0 and the Cloudflare Vite plugin from 1.37.1 to 1.48.0.
- Overrode Next's optional Sharp dependency to 0.35.2 to address the reported libvips advisory.
- Ran the non-breaking `npm audit fix`, then reinstalled and deduplicated the dependency tree.

The initial audit reported 18 dependency entries: 1 low, 4 moderate, 13 high, and 0 critical. The reviewed lockfile reports 15 entries: 5 moderate, 10 high, and 0 critical. Most remaining full-tree entries are transitive paths through development-only ESLint and Drizzle CLI tooling.

## Known residual risk

The production-only audit reports two dependency entries, both caused by the PostCSS 8.4.31 copy bundled inside Next 16.2.12. npm's offered remediation is an incompatible downgrade of Next, so it was not applied. HEARTH does not accept or transform user-supplied CSS, source maps, or image uploads in this Phase 1 build, which limits exposure but does not eliminate the dependency risk.

The development tree also retains:

- a brace-expansion/minimatch denial-of-service advisory through ESLint;
- an older esbuild development-server advisory through Drizzle Kit; and
- dependent-package entries that inherit those two advisories.

The offered fixes require breaking toolchain changes. They are recorded for an isolated Phase 2 dependency-upgrade branch. No forced or breaking audit rewrite was used in this release.

This audit is a dependency review, not a penetration test or a claim of production security certification.
