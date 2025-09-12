# Project Breakdown: Epics, Story Points & Tasks

## Epic 1: User Authentication & Profile (10 SP)
### User Stories
- As a user, I want to sign up, log in, and manage my profile.

#### Tasks
- [ ] Design signup/login UI (1 SP)
- [ ] Implement authentication logic (2 SP)
- [ ] Create user profile page (1 SP)
- [ ] Integrate JWT/session authentication (2 SP)
- [ ] Add profile picture upload (1 SP)
- [ ] Test authentication flows (1 SP)
- [ ] Integrate Google authentication (2 SP)

## Epic 2: Habit Management (10 SP)
### User Stories
- As a user, I want to add, edit, and track my habits.

### Scope
Core flow: create habit -> daily/weekly/monthly logging -> view streak/history -> edit -> archive.
Deferred (not in this epic): reminders/notifications, habit categories, bulk import, AI suggestions.

### Data Model (Draft)
Habit: { _id, userId, title, description?, frequencyType(daily|weekly|monthly|custom), daysOfWeek?[0-6], timesPerPeriod?, colorTag?, icon?, isArchived(false), createdAt, updatedAt }
HabitLog: { _id, habitId, userId, date(YYYY-MM-DD UTC), status(completed|missed|skipped|partial), note?, createdAt }

### API Contract (Initial)
POST   /api/habits
GET    /api/habits            (active only unless ?archived=true)
GET    /api/habits/:id
PATCH  /api/habits/:id        (partial update)
PATCH  /api/habits/:id/archive
DELETE /api/habits/:id        (soft => archive)
POST   /api/habits/:id/logs   {date,status,note}
GET    /api/habits/:id/logs?from=YYYY-MM-DD&to=YYYY-MM-DD

### Acceptance Criteria
- Required fields validated (title >=3 chars, frequencyType valid).
- User only sees & mutates own habits (auth + ownership guard).
- Logging the same date updates existing log (idempotent per habit+date).
- Streak calculation ignores skipped days and respects frequency.
- Archiving hides habit from default list but preserves logs.
- UI shows loading, empty, error, and success states gracefully.

### Breakdown (Total 10 SP)
Frontend (5 SP)
- [ ] Wireframes / component structure (0.5 SP)
- [ ] HabitList (fetch + empty state + archived filter) (0.75 SP)
- [ ] HabitForm (create/edit + validation + frequency selector) (1 SP)
- [ ] TrackerGrid (day/week/month views + responsive) (1.25 SP)
- [ ] Log toggle interaction (optimistic update + toast rollback) (0.75 SP)
- [ ] Archive / restore UI + filter chips (0.5 SP)
- [ ] Accessibility (keyboard toggle, ARIA labels) (0.25 SP)

Backend (3 SP)
- [ ] Mongoose schemas + indexes (habitId+date on HabitLog) (0.5 SP)
- [ ] CRUD endpoints w/ auth + validation (1 SP)
- [ ] Log create/update endpoint (idempotent) (0.5 SP)
- [ ] Streak & frequency util functions (0.5 SP)
- [ ] Date range logs query + pagination safeguard (0.5 SP)

Quality / Cross-Cutting (2 SP)
- [ ] Unit tests (models + streak util edge cases) (0.75 SP)
- [ ] Integration test flow (create -> log -> edit -> archive) (0.5 SP)
- [ ] Error & loading state polish (0.25 SP)
- [ ] Documentation (API examples + usage in README) (0.25 SP)
- [ ] Performance check: batch log fetch (0.25 SP)

### Edge Cases
- Weekly habit with no daysOfWeek => validation error.
- Future-dated log rejected (allow today or past only).
- Rapid multiple toggles debounce + last state wins.
- Editing frequency does not retroactively delete past logs.

### Risks & Mitigation
- Large log queries -> enforce max 90-day window per request.
- Timezone drift -> store dates in UTC (date-only) and derive local client view.
- Race on concurrent log updates -> use upsert with unique index (habitId+date).

### Definition of Done
- All acceptance criteria met.
- Tests passing (unit + integration for critical paths).
- API documented and referenced in frontend code comments.
- No critical eslint errors; components responsive down to 360px width.

## Epic 3: Progress Visualization (6 SP)
### User Stories
- As a user, I want to see my progress in charts and streaks.

#### Tasks
- [ ] Design progress visualization UI (1 SP)
- [ ] Integrate chart library (1 SP)
- [ ] Implement streaks logic (2 SP)
- [ ] Connect frontend to progress data (1 SP)
- [ ] Test visualization features (1 SP)

## Epic 4: Friends & Social Features (8 SP)
### User Stories
- As a user, I want to add friends, view their habits, and compare progress.

#### Tasks
- [ ] Design friends management UI (1 SP)
- [ ] Implement invite/add friend (email/link) (2 SP)
- [ ] Backend endpoints for friends (2 SP)
- [ ] View friends' habits/progress (2 SP)
- [ ] Compare progress logic (1 SP)

## Epic 5: Leaderboard & Motivational Quotes (5 SP)
### User Stories
- As a user, I want to see rankings and motivational quotes.

#### Tasks
- [ ] Design leaderboard UI (1 SP)
- [ ] Implement leaderboard logic (2 SP)
- [ ] Add motivational quotes section (1 SP)
- [ ] Backend for leaderboard/quotes (1 SP)

## Epic 6: Privacy & Settings (4 SP)
### User Stories
- As a user, I want to control who can see my habits and progress.

#### Tasks
- [ ] Design privacy settings UI (1 SP)
- [ ] Implement privacy controls (2 SP)
- [ ] Test privacy features (1 SP)

## Epic 7: Mobile Friendly & Deployment (4 SP)
### User Stories
- As a user, I want the app to work well on mobile and be easily deployable.

#### Tasks
- [ ] Responsive design with Tailwind (2 SP)
- [ ] Test on multiple devices (1 SP)
- [ ] Prepare for deployment (1 SP)

---
Total Story Points: 47
Yeh breakdown aapko development mein step-by-step guide karega. Har task ke liye checkbox hai taake aap progress track kar saken.