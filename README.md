# Acity-Campus-Lost-and-Found-Platform-
A streamlined go-to platform for finding lost items or reporting found belongings on campus. 
Group 5: Safe Hand-off Locations Portal
As part of the Campus Lost & Found Platform Web Technologies mid-semester project,Group 5 was tasked to build the page where students find the safest on-campus places to hand over and collect lost items.
1. What the module does

| Feature | Where | What the user sees |
|---|---|---|
| Campus Map | Map area | Two views switched by tabs: the Academic City virtual campus tour and Google Maps. A note says hub positions are approximate. |
| Live Route (Google View) | Route controls | Pick a hand-off point, start live tracking, see coordinates, and open walking directions in Google Maps. |
| Hand-off Locations | Sidebar 📍 | Hub cards (photo, hours, location, description, live status) with search, hours filter, and a "Closest to me" sort. |
| Hub Directory & Hours | Sidebar 🕒 | Searchable directory with All / Open now / 24/7 filters and live open / closing soon / closed badges in Accra time. |
| Hand-off Guidelines | Sidebar 🛡️ | Five collapsible safety steps, a red-flags warning, and a "Which hub should I use?" helper. |
| How to Claim & Hand Off | Sidebar 🤝 | Four expandable steps with a progress bar. |
| Responsive Layout | Whole page | Side panel on laptops and tablets, bottom sheet on phones. |

This covers MVP feature 5, Campus Hand-off Map & Safe Zone Finder: a visual guide to designated safe pick-up hubs with operational hours. It also supports features 3, 4 and 6 through the guidelines and claim steps (anti-theft verification, anonymous chat, mark as Resolved).
2. Design rules
Colours: red, white, black and a hint of gold, taken from Group 7's design system (ux-ui.css): --red #CC3634, --black #222222, --gold #D4AF37. Gold is used for accents only.
Font: Inter.
Header and footer: Group 8's shared header, navigation and footer.
Semantic HTML5: header, nav, main, aside, section, footer, with labelled landmarks, details/summary for collapsible content, live status messages and a progress bar with ARIA roles.
3. Files
All files sit in the same folder as locations.html, next to ux-ui.css.
| File | Purpose | Author |
|---|---|---|
| `locations.html` | The full page | Kelvina (integration) |
| `locations.css` | Imports every member stylesheet in the right order | Kelvina |
| `locations.js` | Shared hub data (the single source of truth) | Whole group |
| `kelvina-safe-hand-off.html` / `.css` / `.js` | Map tabs, route controls, sidebar shell | Kelvina |
| `google-maps-config.js` | Google Maps settings (confirm what it holds; keep any API key restricted) | Kelvina, Princess, Damien |
| `damien-hub-list.html` / `.css` / `.js` | Hub cards, open/closed status engine, and hub directory | Damien |
| `princess-item-directory.html` / `.css` / `.js` | Search, filter, and sort | Princess |
| `osman-safety-help.html` / `.css` / `.js` | Safety guidelines and hub helper | Osman |
| `joel-claim-handoff.html` / `.css` / `.js` | Claim steps, shared fixes, and responsive layout | Joel |
| `README.md` | This documentation | Budali (Group 5 section) |

Load order matters.
CSS: Princess's file holds the status badges, so it loads before Damien's. Joel's file loads last because it holds the responsive rules.
JS: group5.js first, then Princess's engine, then everything that uses the hub data.
4. How to run
Clone the repository and open the folder in VS Code.
Right-click locations.html and choose Open with Live Server (or open it in a browser). There is no build step.
Use localhost or https (GitHub Pages) when testing live tracking. Browsers block location access on plain http pages elsewhere.
You need an internet connection for the Inter font, the virtual tour and Google Maps.
5. Team and contributions
The brief says contributions are judged from each person's own GitHub history, so the table below links to evidence. Roles were reassigned during the week, and the final assignments are shown.
| Member | Final Role | Files | Original Assignment | Branch |
|---|---|---|---|---|
| Kelvina Abena Agyenim-Boateng | Campus map, page integration, merging | `kelvina-safe-hand-off.*`, `locations.html`, `locations.css`, `group5.js` | Campus map | `feature/group5-campus-map-layout` |
| Damian Selorm Awuyah | Hub cards, search, filter, sort | `damien-hub-list.*` | Responsive styling and README | `feature/group5-handoff-hub-cards` |
| Akwasi Anane-Gyan Osman | Safety guidelines and hub helper | `osman-safety-help.*` | Hours and status | `feature/group5-handoff-guidelines` |
| Princess Gloria Blankson | Hub directory, hours and status engine | `princess-item-directory.*` | Safety guidelines | `feature/group5-hours-status` |
| Joel Brainy Bonney | Claim steps, responsive layout, README | `joel-claim-handoff.*` | Hub cards | `feature/group5-responsive-readme` |

6. Problems we faced and how we solved them
#	Problem	Cause	Solution
| # | Problem | Cause | Solution |
|---|---|---|---|
| 1 | Page crashed when two data files loaded | Two scripts both declared `const HUBS`. | Only one data file is loaded. |
| 2 | Open/Closed badges were hard-coded | The first cards said "Open" in plain HTML, so they stayed "Open" at midnight. | Princess's engine computes status from the hours in Accra time and refreshes every minute. Cards only carry a hook for it. |
| 3 | Group 7's `ux-ui.css` broke our layout | Its global rules padded every `<section>`, centered and padded `<main>`, and reset padding on every element, which removed list bullets. | `.portal` and `.campus-map` cancel the padding and centering. Lists set their own spacing and bullets. |
| 4 | Header title bigger than other pages | Our CSS redefined `header h1` and `body`. | Removed. Header, body, and colours come only from Group 7. |
| 5 | Duplicate colour variables | We redefined `--red`, `--gold`, and the rest. | Use Group 7's variables only. |
| 6 | Script crashed with "HUBS is not defined" | The map script loaded before the data file. | Fixed the load order: data, then the status engine, then everything else. |
| 7 | Sidebar buttons did nothing | Typos in the HTML: two class attributes on one button, `side__btn` instead of `sidebar__btn`. | Corrected class names. |
| 8 | Map styles not applied | Class names used one underscore (`campus-map_trail`) where the CSS used two. | Matched the names in HTML and CSS. |
| 9 | Trail did not line up with pins | `preserveAscpectRatio` typo. | Corrected spelling. Later, the trail was dropped (see #13). |
| 10 | Virtual tour could not carry map pins | The tour is a website, not a map image. Pins are positioned by percentage, so they floated over the wrong places, and the pin layer blocked the tour. The university site may also refuse to be embedded. | Added a second tab with Google Maps, where positions are real coordinates. Kept a link to open the tour in a new tab. Added a visible note that positions are approximate. |
| 11 | Browser location cannot be matched to a picture map | GPS gives latitude and longitude, not a position on an image. | Moved live tracking and directions to the Google Maps view. |
| 12 | Google's logo and the embed's buttons were covered | Our route controls sat on the bottom-left and the sidebar covered the left edge. | The map frame starts after the sidebar, and the controls sit above Google's logo. |
| 13 | Tour link hidden on phones | The bottom sheet covered it. | Positioned above the sheet with a `--sheet-h` variable. |
| 14 | Page path mismatch with Group 7 | Their menu links to `locations.html`, but our page was `group5.html`. | Renamed our page to `locations.html`. |
| 15 | Search box and status badges looked wrong | `ux-ui.css` puts an 18px bottom margin on every input, and a card rule turned the badge text light grey on pale green. | Margins cancelled inside our controls, and the grey colour applies only to plain card text. |
| 16 | Accessibility gaps | One label wrapped both a dropdown and an input, a control group had no role, no skip link, and no page heading. | Separate accessible names, `role="group"`, a skip link, a hidden page heading, and a `noscript` message. |
| 17 | Wrong coordinate order is easy | Google Maps uses latitude then longitude. | `lat` first, `lng` second in `locations.js`. |
| 18 | Shared array could be reordered | Sorting `HUBS` directly would change the order for every other panel. | Sort a copy: `[...HUBS].sort(...)`. |
| 19 | Possible API key exposure | `google-maps-config.js` may hold a key. | Restrict the key to our GitHub Pages address. The plain embed needs no key. |


8. Git workflow
One feature branch per member, named feature/group5-description. Nothing is committed directly to main.
Worked in a testing  environment or did all our testing in a different folder outside the repository then later committed everything as 1 directly to the main
Pull requests need one approval from Group 8 and one from a student in another group.
Every member reviews at least one teammate's pull request.
9. Testing
Opened in Chrome with Live Server on a laptop screen, and checked the phone layouts by narrowing the window.
Checked open/closed status for hubs with weekday-only hours, 24/7 hubs and windows past midnight.
Checked that every sidebar panel opens and closes (including with the Esc key), that filters and searches update results, and that the claim progress bar counts correctly.
Keyboard test: every control can be reached with Tab and the skip link works.
10. Known limitations and future work
No hubs are marked on the virtual tour. Marking them needs real coordinates and the Google view.
Future: an offline-friendly cache, and connecting the "Mark as Resolved" step to the dashboard module.
11. Tools and credits
Design system and colours: Group 7. Header, footer and repository: Group 8.
Map views: Academic City virtual campus tour and Google Maps embed.
AI assistance: the group used Claude,ChatGPT and Gemini to review code, find bugs, draft starter files and help write this documentation.
