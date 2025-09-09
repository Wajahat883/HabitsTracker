# App Flow Diagrams (Mermaid)

## User Registration & Login Flow
```mermaid
flowchart TD
    A[User visits app] --> B[Signup/Login page]
    B --> C{Already registered?}
    C -- Yes --> D[Login]
    C -- No --> E[Signup]
    D --> F[Dashboard]
    E --> F[Dashboard]
```

## Habit Management Flow
```mermaid
flowchart TD
    F[Dashboard] --> G[Add Habit]
    F --> H[View/Edit Habits]
    G --> I[Enter habit details]
    I --> J[Save habit]
    J --> H
    H --> K[Track habit (daily/weekly/monthly)]
    K --> L[Progress Visualization]
```

## Friends & Social Flow
```mermaid
flowchart TD
    F[Dashboard] --> M[Friends]
    M --> N[Invite/Add Friend]
    N --> O[Friend accepts]
    O --> P[View friend's habits/progress]
    P --> Q[Compare progress]
```

## Leaderboard Flow
```mermaid
flowchart TD
    F[Dashboard] --> R[Leaderboard]
    R --> S[View rankings]
    S --> T[Motivational Quotes]
```

---
Yeh diagrams app ke main flows ko visualize karte hain.