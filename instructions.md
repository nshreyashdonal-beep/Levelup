# LevelUp UI Instructions

This document is for coding agents and contributors adding or redesigning
Student- and Instructor-facing components. Follow these rules so new pages
feel like part of the existing LevelUp experience instead of introducing a
separate visual style.

## 1. Identify the page role first

- Instructor pages use the green/emerald visual language.
- Student pages use blue/indigo.
- Public and shared content areas should remain neutral unless the page has a
  clearly identified role.
- Do not mix Student indigo accents into an Instructor page.
- Do not mix Instructor emerald accents into a Student page.

## 2. Student UI theme

Student-facing pages use a blue/indigo visual language. Prefer these shared
tokens from `client/src/index.css`:

```css
var(--color-student-primary)       /* #6366f1 */
var(--color-student-primary-dark)  /* #4f46e5 */
var(--color-student-soft)          /* #eef2ff */
var(--color-student-soft-hover)    /* #e0e7ff */
var(--color-text)
var(--color-text-muted)
var(--color-border)
var(--color-white)
var(--radius-large)
var(--shadow-card)
var(--transition-fast)
```

Student design guidance:

- Use indigo for primary actions, active links, badges, icons, and progress
  cues.
- Use soft indigo backgrounds for cards, icon containers, and loading/empty
  states.
- Keep content surfaces white or neutral so indigo accents remain readable.
- Use darker indigo for hover and active states.
- Keep the visual tone clean, calm, and learning-focused.

Student-facing pages currently include `/`, `/signup`, `/student-landing`,
`/student-dashboard`, `/mycourse`, and student views of `/courses/:id`.

### Student navigation and profile menu

Reuse the existing Student navigation:

```jsx
import StudentNav from '../components/StudentNav';

<StudentNav user={user} activeLink="explore" />
```

- Keep the default Student `BrandLogo` styling.
- Use indigo for link hover, active links, search focus, and student profile
  states.
- Pass the real `user` object to preserve the correct Student profile-menu
  destinations.
- Preserve `activeLink` behavior for `explore` and `mycourse`.
- Do not copy Instructor navigation styles into a Student component.

### Student footer

Use the shared footer with the Student variant:

```jsx
import Footer from '../components/Footer';

<Footer variant="student" />
```

The Student footer uses a polished indigo/navy palette with layered surfaces,
soft indigo text, indigo controls, a contained newsletter panel, and the
standard indigo `Up` logo accent. Do not create a separate Student footer.

Current Instructor-facing pages include:

- `/become-instructor`
- `/instructor-welcome`
- `/instructor-dashboard`
- `/manage-courses`

## 3. Instructor theme tokens

Prefer the shared variables in `client/src/index.css`:

```css
var(--color-instructor-primary)       /* #10b981 */
var(--color-instructor-primary-dark)  /* #059669 */
var(--color-instructor-soft)          /* #ecfdf5 */
var(--color-instructor-soft-hover)    /* #d1fae5 */
var(--color-text)
var(--color-text-muted)
var(--color-border)
var(--color-white)
var(--radius-large)
var(--shadow-card)
var(--transition-fast)
```

Use darker forest greens, sage/mint text, and restrained warm amber only as a
small supporting accent when a surface needs extra hierarchy. Do not make the
whole page bright green, and do not use amber for the Instructor brand logo.

## 4. Instructor navigation and profile menu

Reuse the existing components instead of rebuilding navigation:

```jsx
import InstructorNav from '../components/InstructorNav';

<InstructorNav user={user} />
```

Instructor navigation requirements:

- Keep the Instructor `BrandLogo` variant:
  `<BrandLogo variant="instructor" compact />`
- Keep navigation links and destinations unchanged unless the task explicitly
  requires a route change.
- Link hover, active, search-focus, avatar, and Instructor profile-menu states
  must use emerald tones.
- Use `ProfileMenu` with the actual `user` object so its role-specific
  Instructor styling and destinations continue to work.
- Do not copy `StudentNav` styles into an Instructor component.

Relevant shared files:

- `client/src/components/InstructorNav.jsx`
- `client/src/components/InstructorNav.css`
- `client/src/components/ProfileMenu.jsx`
- `client/src/components/ProfileMenu.css`
- `client/src/components/BrandLogo.jsx`
- `client/src/components/BrandLogo.css`

## 5. Instructor footer requirements

Use the shared footer with the Instructor variant:

```jsx
import Footer from '../components/Footer';

<Footer variant="instructor" />
```

The Instructor footer currently uses a polished forest/sage palette:

- Deep forest background with a subtle layered gradient.
- Mint and sage body text.
- Emerald social links and borders.
- A restrained warm amber accent for newsletter controls and small hover
  details.
- Instructor footer logo with a green mark, light `Level`, and green `Up`.

Do not use the default Student footer on an Instructor page. Do not create a
second footer component for a new Instructor route.

## 6. Page layout and component styling

Follow the structure used by `StudentDashboard.jsx` and
`InstructorWelcome.jsx`:

- Keep the main content centered with a readable max width.
- Use clear welcome/header, content section, and action-card groupings.
- Use white or softly tinted surfaces on a calm page background.
- Use rounded cards, subtle borders, and restrained shadows.
- Use emerald only for actions, active states, icons, badges, and role cues.
- Keep neutral content areas white or light sage so text remains readable.
- Use responsive layouts for mobile, tablet, and desktop.
- Prefer explicit, readable CSS classes over compressed or clever abstractions.

For action cards:

- Use `var(--color-instructor-soft)` for icon backgrounds.
- Use `var(--color-instructor-primary-dark)` for action links.
- Use emerald border and shadow changes on hover.
- Preserve keyboard focus visibility and adequate contrast.

## 7. Behavior must not change during visual work

When creating or redesigning a Student or Instructor component:

- Preserve role guards and redirects.
- Preserve existing routes, links, API requests, payloads, and auth storage.
- Preserve loading, empty, error, and unauthorized states.
- Preserve course-management actions and backend behavior.
- Do not invent placeholder statistics or fake backend data.
- Do not remove existing navigation actions just to simplify the layout.

## 8. Accessibility and responsive checks

- Use semantic headings, links, buttons, labels, and landmarks.
- Keep visible `:focus-visible` styles.
- Do not rely on color alone to communicate role or state.
- Ensure cards and actions remain usable at narrow widths.
- Check that long names, emails, titles, and error messages do not overflow.
- Keep touch targets comfortable on mobile.

## 9. Files and patterns to inspect before editing

Before adding a Student or Instructor component, inspect:

1. `client/src/index.css` for shared tokens.
2. `client/src/components/InstructorNav.jsx` and `.css`.
3. `client/src/components/Footer.jsx` and `.css`.
4. `client/src/components/ProfileMenu.jsx` and `.css`.
5. `client/src/components/BrandLogo.jsx` and `.css`.
6. A comparable page such as `InstructorWelcome.jsx` or
   `StudentDashboard.jsx`.
7. `betterUI.md` for the current page-by-page tracker.

Reuse existing patterns before introducing new dependencies, components, or
color systems.

## 10. Validation before finishing

From the `client` directory, run:

```powershell
npm run lint
npm run build
```

Also run:

```powershell
git diff --check
```

Lint warnings that already exist elsewhere in the repository should be
reported, but do not silently ignore new warnings caused by the change.
Manually inspect the Instructor page at desktop and mobile widths and verify
the role guard, navigation links, profile menu, footer, and all existing
actions.
