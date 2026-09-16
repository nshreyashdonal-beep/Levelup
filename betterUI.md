# LevelUp — Better UI Page-Wise Tracker

This file tracks incremental frontend improvements for the `betterUI` branch.
Work through one page or shared area at a time. The goal is to improve visual
clarity, consistency, responsiveness, and accessibility without changing
existing functionality.

**Status:** In progress. Completed items below are changes already implemented
and verified on this branch.

**Theme rule:**

- Student-facing UI uses blue / indigo.
- Instructor-facing UI uses green / emerald.
- Shared surfaces use calm neutral backgrounds, borders, and text colors.

**Working rule:** Complete one task at a time. After each task, inspect the
affected page manually and run the smallest relevant frontend check. Mark an
item complete only after the existing behavior still works. Keep React and
CSS code beginner-friendly and grounded: use clear, descriptive code instead
of compressed short forms, clever abstractions, or unnecessarily complex
patterns. Do not break any existing backend functionality. At the end of each
session, record what changed, which task items were completed, and what checks
or tests were run.

---

## 0. Global Guardrails

- [ ] Do not change backend routes, request payloads, response handling, or
      authentication storage.
- [ ] Do not break auth, role checks, courses, enrollments, reviews, profiles,
      loading states, error states, or redirects.
- [ ] Do not remove or rename existing routes, navigation links, or actions.
- [ ] Preserve the Student blue/indigo and Instructor green/emerald themes.
- [ ] Keep React and CSS readable, explicit, and beginner-friendly.
- [ ] Keep layouts usable at mobile, tablet, and desktop widths.
- [ ] Prefer existing components and CSS patterns before adding dependencies.
- [ ] Keep non-color cues for important states and role distinctions.

## 1. Shared Foundation

- [x] Record the visual baseline for the main pages and shared navigation.
- [x] Add shared color, radius, shadow, transition, and text design tokens.
- [x] Add shared focus-ring and form-font defaults.
- [x] Verify that the shared foundation does not override role-specific styles.
- [ ] Finish consistent page widths, spacing, radii, shadows, and text hierarchy.
- [ ] Remove only duplicated styles that are confirmed to be unused.

## 2. Shared Navbar, Logo, Profile Menu, and Footer

### Navbar

- [x] Improve Navbar spacing, grouping, buttons, search field, hover states,
      and responsive mobile layout.
- [x] Preserve Subscribe, Become Instructor, search, Login, and Signup
      behavior.
- [ ] Verify the Navbar at logged-out, student, and instructor breakpoints.

### Brand logo

- [x] Replace the repeated lightning mark with a subtle three-step progress
      mark.
- [x] Add a reusable `BrandLogo` component.
- [x] Use blue/indigo for student-facing branding and green/emerald for
      instructor navigation branding.
- [x] Refine the `LevelUp` wordmark with a professional two-weight treatment.

### Profile menu

- [ ] Improve avatar, dropdown spacing, borders, and role-specific accents.
- [ ] Preserve Dashboard, My Courses, Instructor Dashboard, and Log out
      destinations.
- [ ] Verify outside-click closing and logout behavior.

### Footer

- [x] Improve Footer hierarchy, spacing, newsletter layout, and responsive
      behavior.
- [x] Add a footer-specific logo treatment so the full `LevelUp` wordmark is
      visible against the dark footer background.
- [ ] Preserve current links and newsletter controls.

## 3. Home Page — `/`

- [x] Replace the plain hero image/text layout with a split-panel hero inspired
      by the provided reference.
- [x] Use neutral supporting surfaces instead of copying the reference
      screenshot's dark green/orange palette.
- [x] Use blue/indigo for the student action and green/emerald for the
      instructor action.
- [x] Add responsive hero layout, rounded image treatment, and small floating
      learning details.
- [x] Fix full-screen hero overlap so the word “neighborhood” remains visible.
- [x] Add clear spacing and a separate surface boundary between the Home hero
      panel and the Journey section so the two panels do not visually collide.
- [x] Leave “Your Journey on LevelUp,” its tabs, and its state behavior
      unchanged.
- [ ] Polish the Home hero copy and action hierarchy after visual review.
- [x] Improve the Journey section spacing, roadmap presentation, role-colored
      tabs/nodes, hover states, and responsive layout without changing its tab
      behavior.
- [ ] Improve How LevelUp Works cards while preserving both navigation actions.
- [ ] Improve student review cards while preserving review content.
- [ ] Verify the full Home page at mobile, tablet, and desktop widths.

## 4. Login Page — `/login`

- [ ] Improve form layout, spacing, labels, input states, and submit button.
- [ ] Improve error presentation and server-unavailable feedback.
- [ ] Preserve the login request, token storage, user storage, and redirect.
- [ ] Verify keyboard navigation, focus states, validation, and mobile layout.

## 5. Signup Page — `/signup`

- [ ] Improve the signup card layout and visual hierarchy.
- [x] Remove the Student/Instructor toggle because this public signup is
      student-only.
- [x] Keep the existing registration payload behavior by always sending
      `role: 'student'`.
- [ ] Preserve registration request, error handling, and login redirect.
- [ ] Verify form validation, keyboard navigation, and mobile layout.

## 6. Become Instructor Page — `/become-instructor`

- [ ] Improve the instructor signup layout and information panel.
- [ ] Keep the green/emerald instructor theme consistent and restrained.
- [ ] Improve field spacing, password controls, and loading/error states.
- [ ] Preserve the instructor registration payload and redirect behavior.
- [ ] Verify the page at mobile, tablet, and desktop widths.

## 7. Student Landing Page — `/student-landing`

- [x] Improve the student navigation shell without changing its links.
- [x] Reuse the Home split hero panel with a single Student-themed
      `Explore Courses` action that focuses the course section.
- [x] Improve course browsing layout, card hierarchy, and readable metadata.
- [x] Improve loading and empty course states.
- [x] Preserve course fetching, course navigation, and displayed backend data.
- [x] Do not change any separate Home page journey section while working here.
- [x] Verify the frontend build, lint, diff formatting, and responsive CSS
      structure for populated, empty, loading, and mobile states.

## 8. Student Dashboard — `/student-dashboard`

- [x] Improve welcome area, progress journey, action cards, and spacing.
- [x] Keep Student blue/indigo accents consistent.
- [x] Improve the dashboard's responsive layout without changing its
      existing guarded rendering behavior.
- [x] Preserve role handling, API requests, course links, and dashboard data.
- [x] Verify the dashboard for a logged-in student at supported widths through
      the guarded render path and responsive CSS structure.

## 9. My Courses — `/mycourse`

- [x] Improve course list/card hierarchy and empty state.
- [x] Keep enrollment/course information easy to scan.
- [x] Preserve course links, API requests, and student navigation.
- [x] Verify populated, empty, loading, and responsive states through the
      implemented render paths and responsive CSS.

## 10. Instructor Welcome — `/instructor-welcome`

- [ ] Improve the welcome hierarchy, journey content, and primary actions.
- [ ] Keep the green/emerald instructor theme consistent.
- [ ] Preserve role checks, navigation targets, and displayed content.
- [ ] Verify responsive behavior and loading/error states.

## 11. Instructor Dashboard — `/instructor-dashboard`

- [ ] Improve statistics, action cards, course-management entry points, and
      visual hierarchy.
- [ ] Keep green/emerald accents consistent without over-coloring neutral
      content areas.
- [ ] Preserve role checks, API requests, and dashboard actions.
- [ ] Verify populated, empty, loading, and responsive states.

## 12. Manage Courses — `/manage-courses`

- [ ] Improve course-management layout, controls, and action hierarchy.
- [ ] Make create, edit, publish, and manage actions clear without changing
      their behavior.
- [ ] Preserve instructor authorization and backend requests.
- [ ] Verify loading, error, empty, and populated states.

## 13. Course Detail — `/courses/:id`

- [ ] Improve course title, instructor, price, rating, and enrollment layout.
- [ ] Improve review list, review form, loading, error, and empty states.
- [ ] Keep student-only enrollment and review behavior unchanged.
- [ ] Preserve instructor restrictions, API requests, and route parameters.
- [ ] Verify logged-out, student, instructor, and responsive views.

## 14. Role Theme Audit

- [ ] Audit every page for accidental mixed role colors.
- [ ] Ensure student actions, active states, and highlights use blue/indigo.
- [ ] Ensure instructor actions, active states, and highlights use
      green/emerald.
- [ ] Keep shared content areas neutral and readable.
- [ ] Verify that color is never the only signal for an important state.

## 15. Cross-Page Accessibility and Responsive Review

- [ ] Check keyboard navigation and visible focus on every primary flow.
- [ ] Check button hover, focus, disabled, and loading states.
- [ ] Check labels, accessible names, image alt text, and heading order.
- [ ] Test narrow mobile, tablet, and desktop widths.
- [ ] Fix overflow, clipped text, cramped cards, and horizontal scrolling.
- [ ] Keep motion subtle and avoid animations that affect functionality.

## 16. Verification and Session Notes

- [ ] Run `npm run lint` from `client` after each coherent UI task.
- [ ] Run `npm run build` from `client` after each coherent group of changes.
- [ ] Check `git diff --check` before finishing a session.
- [ ] Manually verify login, signup, logout, student navigation, instructor
      navigation, course browsing, enrollment, and reviews.
- [ ] Check the browser console for new errors or warnings.
- [ ] Update this file after every verified task.

### Session notes

#### 2026-09-17 — Shared foundation, navigation, logo, and Home hero

- Added shared CSS design tokens, global focus rings, and form-font defaults.
- Redesigned the public Navbar with responsive navigation, improved search,
  grouped actions, and mobile menu behavior.
- Added the reusable subtle progress logo and professional `LevelUp`
  wordmark across public, student, instructor, and footer branding.
- Redesigned the Home hero in `Home.jsx` using the provided split-panel
  reference while preserving the existing journey section and behavior.
- Fixed the full-screen Home hero overlap that hid “neighborhood.”
- Improved the Home “Your Journey on LevelUp” section with a clearer roadmap
  surface, stronger role-colored tabs and nodes, and responsive step layouts.
- Redesigned the Footer with clearer columns, improved contrast, newsletter
  supporting text, responsive stacking, and a visible footer wordmark variant.
- Simplified `/signup` into a student-only registration page by removing the
  role toggle and keeping the existing registration request fixed to the
  student role.
- Redesigned the Student Dashboard presentation with a structured welcome
  panel, student-themed roadmap, clearer action cards, and responsive mobile
  layouts while preserving its role guard and navigation.
- Reworked `/student-landing` to use the shared Home hero format for logged-in
  students, removed logged-out actions, and added a beginner-friendly smooth
  scroll from `Explore Courses` to the course section.
- Improved the `/student-landing` course section with clearer hierarchy,
  student-themed cards, keyboard-accessible course actions, course count,
  and friendlier loading and empty states without changing API behavior.
- Redesigned `/mycourse` with a clearer learning-space header, enrolled-course
  count, student-themed cards, keyboard-accessible course opening, and
  dedicated loading and empty states while preserving the enrollment request.
- Verified with `npm run lint`, `npm run build`, and `git diff --check`.
- Lint still reports existing warnings in unrelated page effects and unused
  catch parameters.

---

## Reference Files

- `PROGRESS.md` — project-wide implementation tracker.
- `react-topics.md` — React learning and implementation reference.
- `track.md` — nearby-instructors feature tracker.
- `UI.png` and `Screenshot 2026-09-17 023101.png` — visual references only.
