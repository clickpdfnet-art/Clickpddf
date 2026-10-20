---
name: Targeted tool repair isolation
description: User requirement to protect unrelated ClickPDF tools and shared website functionality during repairs.
---

Keep repairs within the named tool. Other working tools are read-only design and behavior references, not refactoring targets. Protect their settings, engines, validation, uploads, downloads and workflows, along with shared headers, footers, navigation, layouts, styles, configuration and dependencies.

**Why:** The user explicitly called protection of existing functionality critical and requested targeted repairs rather than website-wide redesigns.

**How to apply:** Prefer tool-specific components and engines, the smallest guarded integration, and unchanged reusable components. Verify backward compatibility of necessary shared edits. Stop and explain before making a potentially breaking shared change. Report modified files and actual regression-test coverage without claiming untested tools were fully exercised.
