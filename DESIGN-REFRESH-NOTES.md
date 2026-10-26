# Group 6 dashboard — corrected ultra-modern visual layer

## Protected global design
- `ux-ui.css` is preserved exactly as supplied in the project archive; its global theme, typography, header, and navigation rules are not redesigned here.
- Dashboard-specific CSS no longer overrides header or navigation styles.
- `global.html` was not modified. It was not included in the supplied ZIP, so no replacement was created.
- Existing dashboard HTML, JavaScript, images, IDs, class names, script order, and refactored boundaries are preserved.

## Rendering fix
- Reported item badges are injected before the image by `status-controls.js`. The card overlay/decorative layer could visually cover them. The corrected CSS raises the badge row above the image and decorative layer and explicitly preserves visibility and readable contrast for Lost/Found and Open/Claimed/Resolved tags.

## Integration contract
Keep all existing JavaScript selectors and IDs, including `#dashboard`, `#reported-items-list`, `#resolved-items-list`, `#claims-list`, `#messages-panel`, `data-count`, `data-tab`, `data-tab-panel`, `data-status`, and `data-unread`. No JavaScript or HTML selectors were renamed.

The dashboard component styling and animations remain CSS-only, use the existing global palette and Inter font, and respect `prefers-reduced-motion`.

## Validation
CSS brace balance and archive contents were checked. Please verify the badges in a live browser using the actual project data and image assets.
