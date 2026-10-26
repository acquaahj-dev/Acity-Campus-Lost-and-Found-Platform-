# Group 6 dashboard — ultra-modern visual layer

## Design intent
A high-polish, minimal SaaS dashboard with editorial typography, generous spacing,
refined surfaces, restrained glass effects, micro-interactions, staggered entrances,
and responsive layouts. The look is inspired by modern product dashboards, not a
copy of any one site's assets or code.

## Protected files
- `ux-ui.css` is byte-for-byte unchanged from the supplied ZIP.
- `index.html` was not present in the supplied ZIP and has not been created or edited.
- Existing HTML, JavaScript, mock data, images, script order, and refactored file boundaries are preserved.

## Refined CSS files
- `dashboard.css`: dashboard canvas, dashboard-only header refinement, hero, metrics,
  workspace, tabs, panel entrances, reusable animation hooks and responsive rules.
- `reported-items.css`: image-led item cards, hover depth, focus state and card metadata.
- `pending-claims.css`: structured claim rows, accent rails, badges and action micro-interactions.
- `status-controls.css`: pill-shaped status actions, confirmation dialog and toast.
- `messages-panel.css`: conversation summary rows, unread indicators, avatar micro-interactions.

## Integration contract
- Keep the existing IDs and attributes used by JavaScript: `#dashboard`,
  `#reported-items-list`, `#resolved-items-list`, `#claims-list`, `#messages-panel`,
  `data-count`, `data-tab`, `data-tab-panel`, `data-status`, and `data-unread`.
- Existing class names consumed by scripts have not been renamed.
- Shared `--dash-*` tokens remain aliases of Group 7's global palette. The CSS uses
  only the global palette (`--red`, `--dark-red`, `--black`, `--white`, `--light-gray`,
  `--border`, `--gold`) and the existing Inter font.
- `.dash-btn`, `.dash-motion-in`, `.dash-grid`, `.dash-panel`, and `.empty-state`
  remain reusable hooks for future modules.
- Motion relies mainly on opacity and transforms and respects `prefers-reduced-motion`.
- No new libraries, JavaScript, or build step are required.

## Run locally
Extract the ZIP, open `group6-dashboard/dashboard.html` in VS Code with Live Server,
and test the tabs, item status controls, claim actions, messaging interactions, and
mobile layouts.
