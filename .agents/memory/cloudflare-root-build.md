---
name: Cloudflare monorepo build compatibility
description: Version and environment requirements for Cloudflare building this pnpm workspace.
---

Cloudflare's observed build image selected pnpm 9.10.0 when the root `package.json` did not pin a package manager. The repository lockfile records pnpm 10.26.1 workspace overrides; pnpm 9.10.0 therefore rejects frozen installs with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Regenerating the lock with pnpm 9 removes that override metadata and adds many unrelated platform packages, so preserve the pnpm 10 lock format and pin the manager version instead.

The root `pnpm run build` builds all workspace artifacts. The mockup sandbox requires `PORT` and `BASE_PATH`; the root build supplies defaults only when the caller has not set them.

**Why:** Cloudflare's install image and the lockfile were using different pnpm versions, and the Cloudflare build command runs the monorepo root script without Replit workflow variables.

**How to apply:** keep `packageManager` aligned with the pnpm version that generated the lockfile. Verify with a clean `corepack pnpm install --frozen-lockfile` and run the root build with `PORT` and `BASE_PATH` unset to confirm its defaults.
