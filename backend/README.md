# focusaint Backend API

A production-ready Express.js backend for the focusaint productivity platform with MongoDB integration, OTP-based authentication, and habit tracking.

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI and JWT secret:
```
MONGODB_URI=mongodb://localhost:27017/focusaint
JWT_SECRET=your_secure_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
YOUTUBE_API_KEY=your_youtube_data_api_key_optional
```

### Running

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration with email
- `POST /api/auth/verify-otp` - Verify OTP and create account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user

### User Profile
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)

### Habit Tracking
- `POST /api/habit/session` - Log a habit session (protected)
- `GET /api/habit/sessions` - Get user's habit sessions (protected)
- `GET /api/habit/streak` - Get streak information (protected)
- `GET /api/habit/stats` - Get habit statistics (protected)

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── User.js
│   ├── OTP.js
│   ├── HabitSession.js
│   └── StreakRecord.js
├── routes/          # API route handlers
│   ├── auth.js
│   ├── user.js
│   └── habit.js
├── middleware/      # Express middleware
│   ├── auth.js      # JWT verification
│   └── errorHandler.js
├── services/        # Business logic
│   └── email.js
├── utils/          # Utilities
│   └── validation.js
├── server.js       # Express app entry point
├── .env           # Environment variables
└── package.json   # Dependencies
```

## Features

- **Email OTP Authentication**: Secure signup/login flow
- **JWT Token Management**: Secure API endpoints
- **Habit Session Tracking**: Log and track daily study sessions
- **Streak System**: Automatic streak calculation and tracking
- **User Profiles**: Customizable user settings and preferences
- **CORS Support**: Frontend integration ready
- **Error Handling**: Comprehensive error handling middleware
- **Validation**: Input validation for all endpoints

## Database Schema

### User
- Email, password, profile info, learning goals, preferences

### OTP
- Email, OTP code, expiration time

### HabitSession
- User ID, session duration, study mode, date/time

### StreakRecord
- User ID, current streak, longest streak, last activity date

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/focusaint
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
PORT=5000
OTP_EXPIRY=10
YOUTUBE_API_KEY=optional_for_full_youtube_playlist_fetch
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or Atlas connection string is correct
- Check MONGODB_URI format matches your setup

### CORS Errors
- Verify CORS_ORIGIN matches your frontend URL (default: http://localhost:3000)

### Authentication Failures
- Ensure JWT_SECRET is set and consistent
- Check token expiration times

## Security Notes

- Always use strong JWT_SECRET in production
- Enable HTTPS in production
- Use environment variables for sensitive data
- Implement rate limiting for auth endpoints
- Enable CORS only for trusted origins

## Deployment

For production deployment to Vercel or other platforms:

1. Set environment variables in platform dashboard
2. Ensure MongoDB Atlas connection is whitelisted
3. Update CORS_ORIGIN to production frontend URL
4. Test health endpoint: `/api/health`

## Support

For issues or questions, check logs and ensure all dependencies are installed correctly.
