# Project File Structure

## Frontend (React + Tailwind)
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   └── Signup.js
│   │   ├── Habits/
│   │   │   ├── HabitList.js
│   │   │   ├── HabitForm.js
│   │   │   └── HabitTracker.js
│   │   ├── Friends/
│   │   │   ├── FriendsList.js
│   │   │   └── InviteFriend.js
│   │   ├── Leaderboard/
│   │   │   └── Leaderboard.js
│   │   ├── Quotes/
│   │   │   └── MotivationalQuotes.js
│   │   ├── Notifications/
│   │   │   ├── NotificationList.js
│   │   │   └── NotificationBell.js
│   │   └── Profile/
│   │       └── ProfilePage.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   └── Settings.js
│   ├── App.js
│   ├── index.js
│   └── styles/
│       └── tailwind.css
└── package.json
```

## Backend (Node.js + Express)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── habitController.js
│   │   ├── friendController.js
│   │   ├── leaderboardController.js
│   │   ├── quoteController.js
│   │   └── notificationController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Habit.js
│   │   ├── Friend.js
│   │   ├── Quote.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── habitRoutes.js
│   │   ├── friendRoutes.js
│   │   ├── leaderboardRoutes.js
│   │   ├── quoteRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   └── server.js
├── .env
└── package.json
```

---
Yeh structure ab notification feature ke files bhi show karta hai.