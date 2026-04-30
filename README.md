# focusaint - Habit Tracking & Focus Management Platform

A comprehensive productivity application built with a **monorepo architecture** using npm workspaces. focusaint helps users build and maintain focus habits through interactive habit tracking, streak management, and intelligent analytics.

![focusaint](https://img.shields.io/badge/Monorepo-npm%20workspaces-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-16.0-000000?style=flat-square&logo=next.js)
![Express](https://img.shields.io/badge/Express-5.2-90C53F?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-13AA52?style=flat-square&logo=mongodb)

## 🎯 Features

### Authentication & User Management
- Email-based OTP authentication
- Optional password-based signup
- JWT token management with secure sessions
- User profile customization with learning goals

### Habit Tracking
- Daily habit session logging with duration tracking
- Session history with detailed insights
- Multiple learning modes (Habit, Deep, Quiz, Recall)
- Customizable study preferences

### Streak Management
- Automatic streak calculation
- Current and longest streak tracking
- Streak history and statistics
- Daily consistency metrics

### Analytics & Insights
- Weekly activity charts with Recharts
- Session duration analytics
- Habit completion rates
- Performance trends

### UI/UX Features
- Modern, responsive design with dark theme
- Smooth animations with Framer Motion
- 50+ shadcn/ui components
- Mobile-first responsive layout
- Trust-inspired color palette

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB (via Mongoose)
- Auth/Security: JWT, CSRF protection, rate limiting, Helmet

## Project Structure

```
focusaint-v6/
	backend/   # Express API (default: http://localhost:5000)
	frontend/  # Next.js app (default: http://localhost:3000)
```

## Prerequisites

Install these before running locally:

- Node.js 18+ (recommended)
- npm
- MongoDB (local or MongoDB Atlas)

## 1 Backend Setup

Open a terminal from project root and run:

```bash
cd backend
npm install
```

Create a `backend/.env` file with at least:

```env
MONGODB_URI=mongodb://localhost:27017/focusaint
JWT_SECRET=replace_with_a_secure_secret
CORS_ORIGIN=http://localhost:3000
PORT=5000
OTP_EXPIRY=10
```

Optional variables used by features in this project include API keys, email config, Redis, Sentry, and Stripe values.

Start backend in development mode:

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

Health check: `GET http://localhost:5000/api/health`

## 2 Frontend Setup

Open a second terminal from project root and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

The frontend is configured to proxy `/api/*` requests to `http://localhost:5000/api/*` during local development.

## Development Workflow

Run backend and frontend simultaneously:

- Terminal 1:

```bash
cd backend
npm run dev
```

- Terminal 2:

```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000`.

## Production Commands

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm start
```

## Common Scripts

Backend:

- `npm run dev` - run API with nodemon
- `npm start` - run API with node
- `npm run verify-indexes` - validate Mongo indexes

Frontend:

- `npm run dev` - start Next.js dev server
- `npm run build` - create production build
- `npm start` - start production server

## Troubleshooting

- MongoDB connection errors:
	- Verify `MONGODB_URI` and make sure MongoDB is running.
- CORS issues:
	- Ensure `CORS_ORIGIN` matches frontend URL (`http://localhost:3000`).
- API not reachable from frontend:
	- Confirm backend is running on port `5000`.

