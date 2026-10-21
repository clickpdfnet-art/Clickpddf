---
name: ClickPDF admin dashboard visibility
description: Standing instruction to preserve the admin dashboard while keeping it out of the public site.
---

The user wants the admin dashboard, its code, and its data/backups preserved, but all public access temporarily disabled. Remove or disable every public button, link, shortcut, and URL/query route that opens it; do not delete the dashboard implementation or its stored data.

**Why:** the user explicitly said the dashboard should remain safe as a backup and not be live or accessible from anywhere on the website for now.

**How to apply:** when changing site navigation, footer, blog actions, route parsing, or keyboard shortcuts, keep admin access disabled unless the user asks to re-enable it. Ensure direct admin URLs resolve to a normal public page and never open the panel.
