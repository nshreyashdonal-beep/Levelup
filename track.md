# Nearby Instructors — Feature Tracker

This file tracks just the geolocation / "nearby instructors" map feature —
LevelUp's late-stage differentiator (see PROGRESS.md's checklist). Kept
separate from PROGRESS.md because this feature has enough moving parts
(schema, two map libraries worth of frontend work, a new backend query,
privacy decisions) to need its own space instead of crowding the main
tracker.

**Decided:** the map shows nearby **instructors** (their base location),
not individual sessions. Simpler data model, one geotag per instructor
instead of one per session — sessions keep their existing free-text
`location` field unchanged.

**Status:** Planning only — nothing below is built yet. Work through
each phase top to bottom; check a box only once that piece actually
works, same rule PROGRESS.md uses.

---

## Sub-tasks

### Phase 1 — Schema
- [ ] Add `latitude` and `longitude` (NUMERIC) columns to `instructor_profiles`
- [ ] Decide: store the instructor's exact pin, or round/fuzz it before
      saving, for public-map privacy (see Notes)

### Phase 2 — Instructor sets their location
- [ ] Pick a map library — leaning Leaflet + OpenStreetMap tiles (free,
      no API key, no billing account needed)
- [ ] Build a small "click the map to drop your pin" component
- [ ] Add it to Become Instructor signup (new instructors set it once at
      signup)
- [ ] Decide: also editable later from Instructor Dashboard, or
      signup-only for v1?
- [ ] Backend: extend `POST /api/auth/register` (or add a small
      `PUT /api/instructor-profile` route) to save the picked lat/lng

### Phase 3 — Student's own location
- [ ] Get the student's location via the browser's Geolocation API on
      Student Landing
- [ ] Decide: ask automatically on page load, or behind a
      "Find instructors near me" button (button is more honest about
      why you're asking for permission)
- [ ] Handle permission denied / unsupported browser — fallback to
      either a manual pin-drop or just hiding the map section

### Phase 4 — Backend "nearby" query
- [ ] New route: `GET /api/instructors/nearby?lat=<>&lng=<>`
- [ ] Haversine distance formula in raw SQL (already the plan per
      PROGRESS.md's Decisions Log — no PostGIS), `ORDER BY distance`
- [ ] Decide a default radius (e.g. 25km) and/or result limit
- [ ] Join in enough course info that a map pin can link straight to
      that instructor's course(s)

### Phase 5 — Frontend map UI
- [ ] Add a Leaflet map section on Student Landing, below the
      "Learn from the best in your neighborhood" hero
- [ ] Marker for the student's own position
- [ ] Markers for nearby instructors, from the Phase 4 route
- [ ] Click a pin → popup with instructor name + link to their course(s)
- [ ] Loading state, empty state ("no instructors near you yet"), and
      the permission-denied state from Phase 3

### Phase 6 — Privacy
- [ ] Implement whatever was decided in Phase 1 (exact vs. fuzzed
      coordinates) — don't ship an exact home address pin publicly
      without deciding this on purpose

### Phase 7 — Demo data
- [ ] Seed a handful of instructor profiles with real, spread-out
      coordinates (not all stacked in one spot) so the map actually
      looks alive when demoed

### Phase 8 — Testing & polish
- [ ] Manual QA: allow / deny the location permission prompt, confirm
      both paths work
- [ ] Check map rendering at mobile widths
- [ ] Confirm `localhost` geolocation works in dev (browsers block it
      on non-HTTPS in production — note for whenever this gets deployed)

---

## Notes

*(Brainstorm from the session that started this file — kept for
context on why the plan above looks the way it does.)*

**Is this actually like Rapido?** Not quite — Rapido riders move in
real time, so that app needs live GPS pings, ETA calculation, etc.
Instructors are static (same teaching location day to day), so this is
closer to Zomato's restaurant map or Airbnb's listing map than to
Rapido's live rider tracking. Good news: almost all the "live tracking"
complexity doesn't apply here.

**Why this isn't a small feature:**
1. **No location data exists yet.** `instructor_profiles.location` is
   free text ("Indore"), not coordinates — a schema change comes first.
2. **Getting instructor coordinates.** Geocoding a typed address needs
   a third-party API (extra dependency, rate limits, messy addresses).
   Letting the instructor drop a pin themselves needs no external API
   at all — simpler, matches how the rest of this project has been built.
3. **Getting the student's location.** Browser Geolocation API needs
   permission, and only works on `https://` or `localhost`. Needs a
   fallback for people who say no.
4. **Map library choice.** Google Maps needs a billing-enabled API key.
   Leaflet + OpenStreetMap is free with no key — the practical pick here.
5. **The "nearby" query.** Haversine formula in SQL, no PostGIS needed
   at this data scale — already the plan from PROGRESS.md's Decisions Log.
6. **Privacy.** Publicly plotting an instructor's exact home address is
   a real safety concern — most platforms fuzz the public pin and only
   reveal the exact spot after a booking. Worth deciding on purpose.
7. **Instructor-level vs. session-level geotag.** Considered geotagging
   individual offline sessions instead (more "something's happening
   near you right now" energy, like Rapido/Zomato) — but decided to
   keep it at the instructor level for v1: simpler data model, one
   geotag per person instead of one per session, and it's the more
   direct read of "nearby instructors."
8. **Demo data.** With only 1-2 test instructors in the dev DB, a
   "nearby" map won't look convincing until a few are seeded with
   real, spread-out coordinates.
