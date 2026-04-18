# Graph Report - /home/kenz/Projects/web/Catering  (2026-04-18)

## Corpus Check
- 58 files · ~28,342 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 144 nodes · 152 edges · 38 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 25 edges
2. `useQueryWithTimeout()` - 14 edges
3. `CateringDetail()` - 10 edges
4. `formatDate()` - 8 edges
5. `formatTime12h()` - 6 edges
6. `formatCurrency()` - 6 edges
7. `generateWhatsAppMessage()` - 5 edges
8. `EventCard()` - 5 edges
9. `PaymentsPage()` - 5 edges
10. `ErrorBoundary` - 5 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  /home/kenz/Projects/web/Catering/src/App.jsx → /home/kenz/Projects/web/Catering/src/lib/AuthContext.jsx
- `NotFound()` --calls--> `useAuth()`  [INFERRED]
  /home/kenz/Projects/web/Catering/src/App.jsx → /home/kenz/Projects/web/Catering/src/lib/AuthContext.jsx
- `AppRoutes()` --calls--> `useAuth()`  [INFERRED]
  /home/kenz/Projects/web/Catering/src/App.jsx → /home/kenz/Projects/web/Catering/src/lib/AuthContext.jsx
- `History()` --calls--> `useQueryWithTimeout()`  [INFERRED]
  /home/kenz/Projects/web/Catering/src/pages/History.jsx → /home/kenz/Projects/web/Catering/src/hooks/useQueryWithTimeout.js
- `Dashboard()` --calls--> `useQueryWithTimeout()`  [INFERRED]
  /home/kenz/Projects/web/Catering/src/pages/Home.jsx → /home/kenz/Projects/web/Catering/src/hooks/useQueryWithTimeout.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (11): AdminShell(), AppRoutes(), NotFound(), ProtectedRoute(), useAuth(), CreateCatering(), Login(), Navbar() (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (8): AdminEvents(), AdminSettings(), AdminUsers(), AttendancePage(), EditCatering(), Register(), Settings(), useQueryWithTimeout()

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (6): AdminDashboard(), formatCurrency(), History(), MyCaterings(), MyEvents(), PaymentsPage()

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (10): CateringCard(), CateringDetail(), formatDate(), formatTime12h(), generateWhatsAppMessage(), getRoleLabel(), getStatusBadgeClass(), getStatusLabel() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (1): QueryBoundary

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.83
Nodes (3): getUserFromToken(), requireAdmin(), requireSubAdmin()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (1): Dashboard()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 11`** (2 nodes): `CustomSelect()`, `CustomSelect.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `SegmentedControl.jsx`, `SegmentedControl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `Toggle.jsx`, `Toggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `LoadingState.jsx`, `LoadingState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `ConvexImage()`, `ConvexImage.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `ErrorState()`, `ErrorState.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `OfflineBanner.jsx`, `OfflineBanner()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `EmptyState()`, `EmptyState.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `users.js`, `makeToken()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `fix_spacing.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `firebase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `dropPoints.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `maintenance.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `crons.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `schema.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `files.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `registrations.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `payments.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `dataModel.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `server.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `api.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `api.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 9`, `Community 2`, `Community 3`, `Community 1`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Why does `CateringDetail()` connect `Community 3` to `Community 0`, `Community 1`, `Community 10`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `useQueryWithTimeout()` connect `Community 1` to `Community 9`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `NotFound()`) actually correct?**
  _`useAuth()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `useQueryWithTimeout()` (e.g. with `History()` and `Dashboard()`) actually correct?**
  _`useQueryWithTimeout()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `CateringDetail()` (e.g. with `useAuth()` and `useQueryWithTimeout()`) actually correct?**
  _`CateringDetail()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `formatDate()` (e.g. with `EventCard()` and `CateringDetail()`) actually correct?**
  _`formatDate()` has 6 INFERRED edges - model-reasoned connections that need verification._