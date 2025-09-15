# Habit Tracker App

## Overview
Habit Tracker ek web app hai jisse users apni habits track kar sakte hain, progress dekh sakte hain, aur friends ke sath compare kar sakte hain. App mobile friendly hai aur browser par chalti hai.

## Features
- User authentication (signup/login, Google auth)
- Profile management
- Habit add/edit/track (daily/weekly/monthly)
- Progress visualization (charts, streaks)
- Friends management (invite, add, compare)
- Leaderboard/ranking
- Motivational quotes
- Privacy settings
- Notifications

## Tech Stack
- Frontend: React, JavaScript, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB

## Project Structure
- frontend/
- backend/

## Getting Started
1. Clone the repository
2. Install dependencies for frontend and backend
3. Setup environment variables (.env)
4. Start backend server (`npm start` in backend)
5. Start frontend app (`npm start` in frontend)

## Contributing
- Issues aur feature requests welcome hain!

---
Yeh README app ke overview, features, tech stack, aur setup instructions deta hai.
\n## 🚀 Deployment Guide
\n### 1. Environment Variables (Backend `Backend/.env`)
Add a `.env` file in `Backend/`:
```
PORT=5000
MONGODB_URI=mongodb://mongo:27017/HabitTrackerDB
ACCESS_TOKEN_SECRET=replace_with_long_random_string
REFRESH_TOKEN_SECRET=replace_with_long_random_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
```
For local (without Docker) you can use `mongodb://127.0.0.1:27017/HabitTrackerDB`.

### 2. Frontend Production Build
```
cd Frontend/HabitsTracking
npm install
npm run build
```
Build output: `dist/` (static assets).

### 3. Run with Docker Compose
```
docker compose build
docker compose up -d
```
Services:
- Frontend: http://localhost:5173
- Backend API & Socket.IO: http://localhost:5000
- MongoDB: localhost:27017

### 4. Run Manually (No Docker)
Backend:
```
cd Backend
npm install
npm run start:prod
```
Frontend (serve build):
```
cd Frontend/HabitsTracking
npm install
npm run build
npx serve dist
```

### 5. Reverse Proxy (Nginx SPA Example)
```
server {
	listen 80;
	server_name your-domain.com;
	location /api/ { proxy_pass http://127.0.0.1:5000/api/; proxy_set_header Host $host; }
	location /socket.io/ { proxy_pass http://127.0.0.1:5000/socket.io/; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
	location / { root /var/www/habittracker; try_files $uri /index.html; }
}
```

### 6. Health & Metrics
- `GET /health` simple check.
- `GET /metrics` basic process metrics.

### 7. Security Checklist
- Update CORS in `app.js` for production domains.
- Use strong JWT secrets.
- Use HTTPS via proxy / load balancer.
- Optionally enable request logging to file.

### 8. Scaling Notes
- Use Redis adapter for Socket.IO if multiple backend replicas.
- Use PM2 or containers (current Dockerfiles provided).
- Add monitoring (Prometheus + Grafana) later.

### 9. Common Production Tweaks
| Feature | Action |
| ------- | ------ |
| CORS | Restrict to app domain(s) |
| Logging | Switch morgan to 'combined' or JSON format |
| Static Assets | Serve via CDN or edge cache |
| Rate Limits | Tune per endpoint / auth sensitive routes |
| Presence Store | Externalize to Redis for HA |

### 10. Post-Deploy Smoke Test
```
curl -f http://localhost:5000/health
curl -i http://localhost:5000/api/auth/validate -H "Authorization: Bearer <token>"
```

---
Deployment assets added: Dockerfile.backend, Dockerfile.frontend, docker-compose.yml, updated scripts.