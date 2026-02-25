# ZoyaBites - Food Ordering App

## Overview
ZoyaBites is a food ordering web application built with a Vite/React frontend and Express/MongoDB backend. It features menu browsing, cart management, user authentication, Razorpay payments, and an admin panel.

## Architecture
- **Frontend**: Vite + React 18 SPA with React Router, Tailwind CSS, shadcn/ui
- **Backend**: Express.js (Node.js) with MongoDB (Mongoose), JWT auth
- **Database**: MongoDB Atlas (external)
- **Image Storage**: Cloudinary (external)
- **Payments**: Razorpay (external)
- **Auth**: Firebase Auth (Google Sign-In) + JWT (email/password)

## Production Deployment
- **Frontend**: `zoyabites.com` (static site build)
- **Backend**: `https://zoyabiteskitchen.onrender.com` (Render)
- Frontend connects to backend via `VITE_BACKEND_URL` env var
- In dev mode, Vite proxy handles `/api/*` requests to `localhost:3001`
- In production, `API_BASE` from `src/lib/api.ts` prefixes all API calls with the Render URL

## API Configuration
- All API calls go through `API_BASE` exported from `src/lib/api.ts`
- Dev: `API_BASE = ''` (uses Vite proxy to localhost:3001)
- Prod: `API_BASE = VITE_BACKEND_URL` (uses Render backend URL)
- Files using direct fetch must import `API_BASE` from `@/lib/api`

## Project Structure
```
├── src/                    # Frontend source
│   ├── App.tsx             # Main app with React Router
│   ├── main.tsx            # Entry point
│   ├── index.css           # Global styles + Tailwind config
│   ├── pages-vite-legacy/  # Page components
│   ├── components/         # Reusable UI components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # Auth & Cart context providers
│   ├── hooks/              # Custom hooks
│   └── lib/                # API client (api.ts), firebase config, utils
├── server/                 # Backend source
│   ├── index.js            # Express server with all routes
│   ├── .env                # Backend environment variables
│   └── package.json        # Backend dependencies
├── start.sh                # Startup script (runs backend + frontend)
├── vite.config.ts          # Vite config with API proxy
└── index.html              # HTML entry point
```

## How It Runs
- `start.sh` launches the Express backend on port 3001 and Vite dev server on port 5000
- Vite proxies `/api/*` requests to `http://localhost:3001`
- The workflow "Start application" runs `bash start.sh`

## Key APIs (Backend)
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/google`
- Profile: `/api/profile` (GET/PUT)
- Addresses: `/api/addresses` (CRUD)
- Menu: `/api/menu` (public), `/api/categories`, `/api/products`
- Orders: `/api/orders`, `/api/admin/orders`
- Payments: `/api/create-razorpay-order`, `/api/verify-razorpay-payment`
- Admin: `/api/admin/verify-code`, `/api/admin/access-codes`, `/api/manage-users`
- Upload: `/api/upload-image` (Cloudinary)

## Authentication
- Email/password auth via JWT (backend handles registration, login, token verification)
- Google Sign-In via Firebase Auth (popup flow → Firebase ID token → backend verifies via Google tokeninfo API → creates/finds user in MongoDB → issues JWT)
- Backend endpoint: `/api/auth/google` accepts `{ idToken, email, name }` from Firebase

## Environment Variables
Backend (.env in server/):
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `PORT` - Backend port (3001)

Frontend (Replit env vars, VITE_ prefixed):
- `VITE_BACKEND_URL` - Production backend URL (https://zoyabiteskitchen.onrender.com)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
