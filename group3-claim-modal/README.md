# Project Description
This group's module is meant to create a webpage to display a description of each missing item with a image together with other details. In addition we also provided a claims form with verification to allow the user to only claim what belongs to them.

# Project Features
Our webpage features a nav bar which contains the links to other related webpages.
Our description of the missing items is shown on cards which tile in a grid fashion and resize based on screen resolution.
Each card shows details about the missing item which includes an image, name, description, date lost, location lost/found, item status, category, reference ID, and whether the item was a lost or found object.
A verification form is provided and must be filled when a user wants to claim a missing item.

# Running the Project
In the item-modal.html file
1. Line 7 should be linked to the global css.
2. From line 14 to line 20, the other webpages should be linked to their respective tabs/buttons.
3. Line 44 should be linked to storage.js from group 1's folder. storage.js should be in the js folder

# Additional Info

1. Executive Summary
This formal progress report details the work accomplished by Group 3 (6 members) from Friday, October 23, 2026, to Monday, October 26, 2026. Over this four-day sprint, the team conducted joint planning sessions, mapped UI layouts on whiteboards, developed frontend sub-systems, implemented core anti-theft validation, and coordinated with Group 1 to ensure system-wide software integration .

2. Key Objectives & Scope

•	Item Description Webpage & Forms: Designing and constructing HTML, CSS, and JS components to display item information and handle user submission forms.
•	Anti-Theft System Logic: Defining and building protection mechanisms, such as mandatory submission waiting periods and claim verification workflows.
•	Cross-Group Collaboration: Working alongside Group 1 to unify design themes, global CSS styles, and repository directory structures.

3. Timeline of Activities & Group Meetings

• Friday, Oct 23, 2026 — Initial Project Setup & Planning
Location: L3 Lecture Hall
Held the first official Group 3 meeting in L3. Brainstormed the work approach, outlined the item description forms, and established logic requirements for the anti-theft system.
• Saturday, Oct 24, 2026 — Joint UI Design Session with Group 1
Location: L1 Lecture Hall
Met in L1 with members of Group 1. Mapped out the application wireframe on whiteboards, deciding on background themes (Nebula), navigation bar styling, card containers, and shadow effects.
• Sunday, Oct 25, 2026 — Page Design Updates & Copilot Scripting
Location: Group Work Session
Met as a group to refine page styling in CSS . Leveraged GitHub Copilot in VS Code to implement box-shadow styling on item boxes. Pushed core HTML/CSS/JS components and claim form logic to GitHub.
• Monday, Oct 26, 2026 — System Integration & Repository Restructuring
Location: Computer Lab 2
Gathered in Computer Lab 2 with Group 1 to ensure Group 3's code seamlessly integrates with their system. Reorganized file directories, updated .gitignore, and adjusted header colors.

4. Technical Development & GitHub Commit History

The repository commit history records the following version control updates pushed by team contributor deathjump:
Date	Commit Hash	Commit Summary	Technical Scope & Changes
Oct 26, 2026	Updated gitignore & directory reorganization 	Updated .gitignore to un-track test files/folders. Organized HTML, CSS, and JS into a clean folder structure. Set header background to red.
Oct 25, 2026	Changed header background color 	Updated header background color from black to red.
Oct 25, 2026	Semantic HTML refactoring & font styling	Replaced non-semantic <div> tags with semantic <section> tags. Added Inter font for general typography.
Oct 25, 2026	Added claim form waiting period 	Implemented a mandatory waiting period upon submitting the claim form for anti-theft security.
Oct 25, 2026	Global CSS inheritance & cross-references 	Created webpage references and enabled style inheritance from the global CSS file.
Oct 25, 2026	Form auto-close scripting & test links 	Updated script.js so claim forms automatically close upon submission . Pointed href to test webpage.
Oct 25, 2026	Created item description webpage modules 	Initial setup of HTML, CSS, and JS for item description page . Added .gitignore rule to ignore Group 1 test data.

5. UI/UX & Architectural Specifications

Key UI decisions derived from whiteboard specs and code adjustments include:
•	Background Theme: Nebula-style page background.
•	Navbar Styling: Header background color transitioned from black to red.
•	Item Box Elevators: Dynamic box-shadows applied to item display boxes using Copilot assist.
•	Semantic Structure: Refactored layout containers into semantic <section> tags with Inter font typography.

6. Next Steps & Immediate Action Items

•	Complete Lab Integration: Finalize testing in Computer Lab 2 with Group 1 to confirm module interoperability.
•	Form Submission Verification: Test claim form auto-close scripts and waiting period logic across multiple browsers.
•	Repository README Integration: Incorporate this formal progress log into the project's main repository documentation.
