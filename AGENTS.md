# Agent Instructions

## Project Shape

- This is a dependency-free browser app. Open `index.html` directly or serve the project with any static server.
- Keep the three-layer structure intact:
  - `index.html`: all views, controls, game boards, and accessible labels.
  - `script.js`: DOM wiring, navigation, game rules, rendering, account statistics, and persistence.
  - `style.css`: layout, responsive behavior, light/dark themes, and visual states.
- `README.md` contains the user-facing overview and local run instructions.

## Architecture And State

- The app is an imperative single-page interface. Views are switched through `showView()` and sections are shown or hidden rather than routed through a framework.
- `script.js` caches important DOM nodes at module load. When adding markup, preserve the IDs, classes, `data-*` attributes, button types, and ARIA attributes used by the script.
- Tic-Tac-Toe and Dominoes share player accounts and statistics but have separate round state and rendering paths.
- Account data is stored in `localStorage` under `xo-game-data-v1`; the selected theme uses `xo-theme`. Keep persisted data backward-compatible or add migration logic when changing its shape.
- Use the existing rendering and persistence helpers instead of duplicating state updates or writing directly to unrelated DOM nodes.

## Editing Conventions

- Use plain browser-compatible JavaScript, HTML, and CSS. Do not add a framework, bundler, or dependency unless the task explicitly requires it.
- Match the existing naming style: descriptive camelCase JavaScript identifiers, kebab-case CSS classes, and semantic HTML controls.
- Keep interactive controls keyboard-accessible and preserve live-region announcements and ARIA labels when changing game feedback.
- Preserve the existing visual language and responsive behavior. Add styles near the relevant component section in `style.css` rather than rewriting unrelated rules.

## Validation

- There is no automated test suite or build step. After changes, open or serve `index.html` and manually verify the affected flow.
- For gameplay changes, test a normal round, a win, a draw, starting a new round, pause/resume, and reset behavior as applicable.
- For persistence changes, reload the page and verify accounts, scores, leaderboards, and theme state; also verify the clear-data action.
- Check both desktop and narrow mobile widths, and check both light and dark themes for visual changes.
