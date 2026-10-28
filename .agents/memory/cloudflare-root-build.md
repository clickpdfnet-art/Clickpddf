---
name: Cloudflare monorepo build compatibility
description: Version and environment requirements for Cloudflare building this pnpm workspace.
---

Cloudflare's observed build image selected pnpm 9.10.0 when the root `package.json` did not pin a package manager. The repository lockfile records pnpm 10.26.1 workspace overrides; pnpm 9.10.0 therefore rejects frozen installs with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Regenerating the lock with pnpm 9 removes that override metadata and adds many unrelated platform packages, so preserve the pnpm 10 lock format and pin the manager version instead.

The root `pnpm run build` builds all workspace artifacts. The mockup sandbox requires `PORT` and `BASE_PATH`; the root build supplies defaults only when the caller has not set them.

Wrangler is not a persistent project dependency here. Use `pnpm dlx wrangler` for Cloudflare operations; the configured `CLOUDFLARE_API_TOKEN` can identify its accessible account through `wrangler whoami` even without a separate `CLOUDFLARE_ACCOUNT_ID`.

**Why:** Keeping Wrangler ephemeral avoids adding deploy-only tooling to the website bundle, and account discovery avoids asking for a redundant ID when the token already identifies its account.

**How to apply:** Confirm the token with `wrangler whoami` without printing secrets, then use the root `wrangler.toml` after the root build succeeds.

**Why:** Cloudflare's install image and the lockfile were using different pnpm versions, and the Cloudflare build command runs the monorepo root script without Replit workflow variables.

**How to apply:** keep `packageManager` aligned with the pnpm version that generated the lockfile. Verify with a clean `corepack pnpm install --frozen-lockfile` and run the root build with `PORT` and `BASE_PATH` unset to confirm its defaults.
