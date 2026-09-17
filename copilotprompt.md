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

ontinue the LevelUp project from where PROGRESS.md leaves off.

Attached/linked: my repo (clone or unzip it) and PROGRESS.md.

Rules for this session:

0. OPENING HANDSHAKE — do this before touching any code:
   a. Ask which branch I'm working on this session, then find that branch's own Files
      Created So Far and its highest existing "### Session N (Branch N (Name))" heading.
      State back: "Branch [N] ([Name]) — last recorded Session [N]. Last unchecked
      checklist item for this branch: [X]." (No heading yet for this branch = it's
      Session 1.)
   b. Wait for me to confirm or correct it (e.g. "yes, continue" / "no, work on task Y
      instead").
   c. Only start building after I confirm.

1. Read PROGRESS.md fully — the checklist, decisions log, and current repo layout are your
   only memory of this project. Don't assume anything not written there.
2. Build ONLY the next unchecked checklist item for that branch (or the task I named in
   step 0b). Don't jump ahead, don't build multiple pieces at once.
3. Write the simplest, most beginner-friendly code possible — plain functions, plain SQL,
   short files, comments that explain *why* a line exists. No frameworks, patterns, or
   abstractions beyond what this one piece needs.
4. Don't scaffold the full future directory structure. Only create the files/folders this
   piece actually needs. The repo only ever reflects what exists right now.
5. INCREMENTAL WRITES — do not save the PROGRESS.md update for the end. As soon as one
   file or task is finished, immediately give me a paste-ready update for just that
   piece, as two separate things:
   ✅ Done: <file> — <what/why, one line>
   → 1. Tick the box in Section 1, this branch's checklist, tagged with a session badge:
        - [x] <checklist item> [Session N]
   → 2. Add to this branch's Files Created So Far, under
        "### Session N (Branch N (Name))" (files only — no checklist text here):
        - <file>: <what/why>
   The [Session N] badge always matches this branch's own session number (never a global
   count) — same N as the Session heading the file lands under. If a task spans more than
   one session, tag it with the session it was *completed* in.
   I'll paste it in right away before you start the next piece. This means if the session
   window runs out mid-task, only the current unsaved piece is at risk — not the whole
   session.
6. Branch/session rules:
   - There is no project-wide session counter — each branch counts its own sessions
     independently, based on the highest "### Session N" heading already listed under
     that specific branch's Files Created So Far.
   - Every branch has a permanent number — never invent a new one for an existing
     branch, and never reuse a number.
   - If the branch I choose has no tasks currently listed in its checklist, ask me which
     task(s) I want to work on before starting, and add them to that branch's checklist.
     This applies to any branch, not just one in particular.
7. When done, give me:
   - the new/changed files (as a diff or full files, whichever is clearer for a beginner to apply)
   - the exact text to paste into that branch's "Files Created So Far", "Decisions Log",
     "Repo layout", and checklist (with the box ticked) before my next session.
   - if notes were generated this session, update the "Notes chapter tracking" line for
     whichever track (backend/frontend) was used.

RECOVERY — if the session window/context runs out before step 7 happens:
   - If the chat is still open, send: "Just give me the PROGRESS.md paste-ready update
     for everything done in this chat so far — checklist ticks, files, decisions. Nothing
     else." Claude can reconstruct it from its own earlier messages in the same chat.
   - If the chat is fully dead and nothing was pasted in via step 5 along the way, write
     the entry by hand from the code already sitting in your repo — the repo is the
     ground truth; PROGRESS.md is just prose describing it.
```
