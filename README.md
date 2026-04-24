# FamTrack - Consent-Based Family Live Location Tracker

FamTrack is a full-stack safety project for live GPS location sharing with consent. It uses Node.js, Express, MongoDB, Socket.IO, React, Leaflet, and OpenStreetMap.

## Features
- OTP-style login/register in development
- Create or join a family with invite code
- Consent-based live browser GPS sharing
- Live map dashboard
- Real-time updates with Socket.IO
- SOS alert API
- Location history API

## Run Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Run Web Dashboard
```bash
cd web
npm install
npm run dev
```

Open: http://localhost:3000

## Deploy
- Backend: Render Web Service
- Database: MongoDB Atlas
- Frontend: Vercel

## Important
This project does not track by SIM card. It uses legal GPS/browser permission-based tracking only.
