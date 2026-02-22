# ZoyaBites Backend

Node.js/Express backend for ZoyaBites food ordering app.

## Setup

```bash
cd server
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (Settings → API)
- `RAZORPAY_KEY_ID` — Razorpay test key ID (starts with `rzp_test_`)
- `RAZORPAY_KEY_SECRET` — Razorpay test key secret
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret

## Run

```bash
npm start
```

Server starts on `http://localhost:5000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-image` | Upload image to Cloudinary |
| POST | `/api/create-razorpay-order` | Create Razorpay payment order |
| POST | `/api/verify-razorpay-payment` | Verify Razorpay payment signature |
| POST | `/api/manage-users` | Admin: list users, add/remove roles |
| GET | `/api/health` | Health check |

## Project Structure

```
server/
├── index.js          # Main server file (all routes)
├── package.json      # Dependencies
├── .env.example      # Environment template
└── README.md         # This file
```
