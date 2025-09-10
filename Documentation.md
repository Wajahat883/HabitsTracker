# Project Documentation

## Overview
Yeh Habit Tracker app ka backend hai, jo Node.js, Express, aur MongoDB (Mongoose) par bana hai. Neeche har major component ki theory aur explanation di gayi hai.

## Models
- **User.js**: User ki basic information, authentication, profile picture, friends list, aur privacy settings store karta hai.
- **Habit.js**: User ki habits, unki details, frequency (daily/weekly/monthly), aur tracking data store karta hai.
- **Friend.js**: User ke friends aur unka status (pending, accepted, rejected) manage karta hai.
- **Quote.js**: Motivational quotes aur unke authors store karta hai.
- **Notification.js**: User ke notifications (message, read/unread status) store karta hai.

## Controllers
- **quoteController.js**: Quotes ke liye CRUD operations handle karta hai (get, add, delete).
- Baaki controllers (auth, habit, friend, leaderboard, notification) bhi isi tarah har feature ke logic ko manage karte hain.

## Routes
- **quoteRoutes.js**: Express routes banata hai jo quoteController ke functions ko API endpoints se connect karta hai.
- Baaki routes (authRoutes, habitRoutes, friendRoutes, leaderboardRoutes, notificationRoutes) bhi har feature ke liye endpoints define karte hain.

## Config
- **db.js**: MongoDB ke sath connection setup karta hai.
- **app.js**: Express app ke middleware (CORS, JSON parsing, static files, cookies) configure karta hai.

## Flow
1. User request karta hai (e.g. GET /quotes)
2. Route us request ko controller function tak pohanchata hai
3. Controller database se data fetch ya update karta hai
4. Response user ko milta hai

---
Yeh documentation aapko backend ki structure aur har part ki theory samajhne mein madad karegi.