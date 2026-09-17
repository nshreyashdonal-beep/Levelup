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



## 5. Session Prompt (copy-paste this each time)

```
Continue the LevelUp project from where PROGRESS.md leaves off.

Ask from user which Progress.md Phase and branch we are working on 
Ex: Phase: 2  Branch : main

Attached/linked: my repo (clone or unzip it) and PROGRESS.md.

Rules for this session:
1. Read PROGRESS.md first — the checklist, decisions log, and current repo layout are your
   only memory of this project. Don't assume anything not written there.
2. Build ONLY the next unchecked checklist item. Don't jump ahead, don't build multiple
   pieces at once.
3. Write the simplest, most beginner-friendly code possible — plain functions, plain SQL,
   short files, comments that explain *why* a line exists. No frameworks, patterns, or
   abstractions beyond what this one piece needs.
4. Don't scaffold the full future directory structure. Only create the files/folders this
   piece actually needs. The repo only ever reflects what exists right now.
5. Phase 2 session rules:
   - Increment the "Session counter" under Phase 2 by 1 at the start of this session.
   - Ask me which branch I'm working on this session (e.g. `Main` or `InstructorFunctionalities`).
   - If I say `Main`, every entry added to this session's "Files Created So Far" must mention
     the branch name in brackets, e.g. `client/src/pages/Foo.jsx (Main)`.
   - If the branch I choose has no tasks currently listed in its checklist, ask me which
     task(s) I want to work on before starting, and add them to that branch's checklist.
     This applies to any branch, not just one in particular.
6. When done, give me:
   - the new/changed files (as a diff or full files, whichever is clearer for a beginner to apply)
   - the exact text to paste into PROGRESS.md's "Files Created So Far", "Decisions Log",
     "Repo layout", and checklist (with the box ticked) before my next session.
   - if notes were generated this session, update the "Notes chapter tracking" line for
     whichever track (backend/frontend) was used.
```

