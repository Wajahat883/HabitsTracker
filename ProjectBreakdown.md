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

## Epic 3: Progress Visualization (8 SP)
### Goal
Give users clear, actionable insight into their habits using charts, streaks, and heatmaps so they can understand trends and maintain motivation.

### User Stories
- As a user, I want a summary dashboard showing completion %, average streak, and longest streak.
- As a user, I want a calendar heatmap showing days I completed habits.
- As a user, I want per-habit trend charts (last N days) and an aggregated completion chart.

### Data & API Contract
- GET /api/progress/summary?range=30d&userId={id} -> { overallCompletion, activeHabits, avgStreak, longestStreak, habitStreaks: [{habitId,title,streak}] }
- GET /api/progress/heatmap?year=2025&userId={id} -> [{date: 'YYYY-MM-DD', count: n}, ...]
- GET /api/progress/habit/:id/trend?days=30 -> [{date:'YYYY-MM-DD', completed:0|1|count}, ...]

Data shapes (frontend contract):
- ProgressSummary: { overallCompletion: number, activeHabits: number, avgStreak: number, longestStreak: number, habitStreaks: Array }
- Heatmap: Array<{date:string, count:number}>
- HabitTrend: Array<{date:string, completedCount:number}>

### Acceptance Criteria
- Dashboard loads summary, heatmap, and a small list of top/bottom habits within 1s for typical local dev data.
- Heatmap shows correct counts for completed logs for the selected year.
- Per-habit trend shows a line/bar for the past N days; toggling N (7/30/90) updates chart.
- All API endpoints require auth and return 401 for unauthenticated requests.
- Charts display graceful states: loading spinner, "no data" message, and error toast.

### Frontend (3 SP)
- [ ] UI/UX: wireframe small dashboard panel + modal drilldown (0.5 SP)
- [ ] Implement `ProgressSummary` component (fetch + display cards) (0.75 SP)
- [ ] Implement `CalendarHeatmap` component (reusable, accessible) (0.75 SP)
- [ ] Implement `HabitTrendChart` component with range selector (0.75 SP)

### Backend (3 SP)
- [ ] Implement summary aggregation endpoint (efficient queries, index usage) (1 SP)
- [ ] Implement heatmap endpoint (group by date, return sparse map) (1 SP)
- [ ] Implement per-habit trend endpoint (date range fill and upsert-safe aggregation) (1 SP)

### Quality / Cross-cutting (2 SP)
- [ ] Unit tests for aggregation functions (streak calculations, date range fill) (0.75 SP)
- [ ] Integration test (create habit(s) -> add logs -> query summary/heatmap) (0.75 SP)
- [ ] Performance check for 90-day range (bench and memoize if needed) (0.5 SP)

### Edge cases
- No habits -> show friendly CTA to add a habit.
- Sparse logs -> heatmap should render gaps, not crash.
- Multiple logs per day -> aggregate counts correctly (or normalize to completed boolean per design).

### Risks & Mitigation
- Large user data sets: enforce default window (30/90 days) and paginate per-habit data.
- Timezones: store and aggregate by UTC date-string; client maps to local display.

### Definition of Done
- Endpoints implemented and documented in the repo README.
- Frontend components integrated into `Dashboard` and working with real API.
- Tests for critical aggregations pass.


## Epic 4: Friends & Social Features (10 SP)
### Goal
Enable lightweight social features so users can connect, share progress (opt-in), and compare with friends while preserving privacy controls.

### User Stories
- As a user, I want to send/accept friend requests and manage my friends list.
- As a user, I want to view a friend's public habits and a simplified progress summary (if they opt-in).
- As a user, I want to invite friends by email or by sharing an invite link.

### Data & API Contract
- POST /api/friends/invite { email } -> create invite record / send email (or return link in dev)
- POST /api/friends/accept { inviteId } -> make friendship relation
- GET /api/friends -> list friends (id, name, avatar, friendshipStatus)
- GET /api/friends/:id/habits -> list friend's public/visible habits
- GET /api/friends/:id/progress?range=30d -> friend's public progress summary (respect privacy)
- DELETE /api/friends/:id -> remove friend

Privacy contract: a user can set habit visibility to {private, friends, public}. Only habits with visibility=friends or public are returned to friends; progress endpoints obey the same visibility.

### Acceptance Criteria
- Invite flow: creating an invite stores a server record and returns a shareable URL in dev mode.
- Accepting an invite establishes friendship; both users appear in each other's friend list.
- Privacy respected: requesting a friend's habits/progress returns 403 if not permitted.
- Friend removal revokes access immediately.

### Frontend (4 SP)
- [ ] Design friends management screens (list, search, pending invites) (0.5 SP)
- [ ] Implement `FriendsList` component with friend cards and actions (1 SP)
- [ ] Implement `InviteFriends` component (email input + copy link) (0.75 SP)
- [ ] Integrate friends' habit & progress views into `Dashboard` as a toggle/tab (1 SP)
- [ ] Add toast/error handling and loading states across flows (0.75 SP)

### Backend (4 SP)
- [ ] Mongoose Friend/Invite models + indexes (0.5 SP)
- [ ] Endpoints: invite, accept, list, get habits, remove (2 SP)
- [ ] Privacy checks middleware (0.75 SP)
- [ ] Email sending stub (dev) and rate-limit invites (0.75 SP)

### Quality / Cross-cutting (2 SP)
- [ ] Unit tests for invite/accept/remove logic and privacy rules (1 SP)
- [ ] Integration tests: invite -> accept -> fetch friend data -> remove (1 SP)

### Edge cases
- Repeated invites to same email -> idempotent response with pending state.
- Accept invite for already-friends -> return 409 or idempotent success.
- Deleting a user -> cascade or mark friendships inactive.

### Risks & Mitigation
- Abuse (spam invites): rate-limit invites and add simple abuse heuristics.
- Privacy leakage: implement strict server-side checks and tests.

### Definition of Done
- Friend invites, accept, list, view habits, and privacy enforcement are implemented end-to-end with tests and documented API.


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