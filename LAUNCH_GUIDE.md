# FamTrack — Complete Build & Launch Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FAMTRACK SYSTEM                      │
├──────────────┬──────────────────────────┬───────────────┤
│  Mobile App  │      Backend API          │  Web Dashboard │
│ React Native │   Node.js + Socket.IO     │     React      │
│  iOS/Android │   Express + MongoDB       │   Leaflet.js   │
└──────┬───────┴──────────┬───────────────┴───────────────┘
       │ GPS pings         │ WebSocket broadcast
       │ every 30–60s      │ to family room
       └──────────────────►│
                           │◄── Firebase FCM push alerts
                     MongoDB Atlas
                    (location history,
                     users, stoppages)
```

---

## PHASE 1 — Prerequisites (Day 1)

### Accounts to create (all free tiers work to start):
- **MongoDB Atlas** → https://cloud.mongodb.com (free 512 MB)
- **Firebase** → https://console.firebase.google.com (for push notifications)
- **Twilio** → https://twilio.com/try-twilio (for OTP SMS — $15 free credit)
- **Google Cloud** → https://console.cloud.google.com (Maps API for geocoding)
- **Railway or Render** → https://railway.app or https://render.com (backend hosting, free tier)
- **Apple Developer** → https://developer.apple.com ($99/year, needed only for iOS)
- **Google Play Console** → https://play.google.com/console ($25 one-time)

### Install on your machine:
```bash
# Node.js 20+
https://nodejs.org

# React Native CLI
npm install -g react-native @react-native-community/cli

# For Android: Android Studio
https://developer.android.com/studio

# For iOS (Mac only): Xcode from App Store

# MongoDB Compass (GUI)
https://www.mongodb.com/products/compass

# Docker Desktop
https://www.docker.com/products/docker-desktop
```

---

## PHASE 2 — Backend Setup (Week 1, Days 2–5)

### Step 1: Clone and install
```bash
# Navigate to the backend folder
cd famtrack/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Now open .env in your editor and fill in all values
```

### Step 2: Set up MongoDB Atlas
1. Sign in to cloud.mongodb.com
2. Create a new project → "FamTrack"
3. Build a database → M0 Free tier → AWS Mumbai (ap-south-1)
4. Create a database user (username + password)
5. In "Network Access", add IP → 0.0.0.0/0 (allow all for now)
6. Click "Connect" → "Drivers" → copy the URI
7. Paste it into `.env` as `MONGODB_URI`

### Step 3: Set up Twilio OTP
1. Sign up at twilio.com
2. Verify your phone number
3. Buy a phone number (or use the trial number)
4. From dashboard copy: Account SID, Auth Token, Phone Number
5. Paste into `.env`

### Step 4: Set up Firebase
1. Go to Firebase Console → New project → "famtrack-prod"
2. Enable Cloud Messaging (FCM)
3. Project Settings → Service Accounts → Generate New Private Key
4. Download the JSON file
5. Copy `project_id`, `private_key`, `client_email` into `.env`

### Step 5: Start the backend
```bash
npm run dev
# Should print: "MongoDB connected" and "FamTrack server on port 5000"

# Test it:
curl http://localhost:5000/health
# → {"status":"ok","time":"..."}
```

---

## PHASE 3 — Mobile App Setup (Week 2–3)

### Step 1: Create React Native project
```bash
npx react-native init FamTrackApp --template react-native-template-typescript
cd FamTrackApp

# Install all dependencies
npm install \
  react-native-background-geolocation \
  react-native-maps \
  socket.io-client \
  @react-native-async-storage/async-storage \
  @react-navigation/native \
  @react-navigation/stack \
  react-native-vector-icons \
  axios
```

### Step 2: Copy source files
Copy all files from `famtrack/mobile/src/` into your new project's `src/` folder.

### Step 3: Configure Background Geolocation

**Android** — add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

**iOS** — add to `ios/FamTrackApp/Info.plist`:
```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>FamTrack needs background location to keep your family safe</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>FamTrack uses your location to share with family members</string>
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
</array>
```

### Step 4: Add Google Maps API key

**Android** — in `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_GOOGLE_MAPS_KEY"/>
```

**iOS** — in `ios/FamTrackApp/AppDelegate.m`:
```objc
#import <GoogleMaps/GoogleMaps.h>
// In didFinishLaunchingWithOptions:
[GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_KEY"];
```

### Step 5: Create src/config.js
```js
export const API_BASE = __DEV__
  ? 'http://10.0.2.2:5000'    // Android emulator → localhost
  : 'https://api.famtrack.app'; // Production URL
```

### Step 6: Run on device
```bash
# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## PHASE 4 — Web Dashboard (Week 4–5)

### Step 1: Create React app
```bash
npx create-react-app famtrack-web
cd famtrack-web
npm install leaflet react-leaflet socket.io-client axios date-fns
```

### Step 2: Copy web source files
Copy all files from `famtrack/web/src/` into your project.

### Step 3: Run it
```bash
REACT_APP_API_URL=http://localhost:5000 npm start
```

---

## PHASE 5 — Deployment (Week 12–14)

### Backend: Deploy to Railway (easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init   # in your backend folder
railway up

# Set environment variables in Railway dashboard
# Under Variables tab, add all your .env values
```

### Backend: Deploy to AWS EC2 (production scale)
```bash
# 1. Launch EC2 instance: t3.small, Ubuntu 22.04, open ports 22, 80, 443, 5000

# 2. SSH in
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 3. Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# 4. Clone your code
git clone https://github.com/yourusername/famtrack.git
cd famtrack

# 5. Add .env
nano backend/.env  # paste your values

# 6. Start everything
docker-compose up -d

# 7. Set up free SSL with Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d api.yourdomain.com
```

### Deploy Web Dashboard: Vercel (free)
```bash
npm install -g vercel
cd famtrack-web
vercel --prod
# Set REACT_APP_API_URL to your Railway/EC2 URL in Vercel dashboard
```

---

## PHASE 6 — App Store Publishing

### Google Play Store
1. Build signed APK:
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```
2. Go to play.google.com/console
3. Create app → Fill details
4. Upload APK under "Production" track
5. Fill in store listing (screenshots, description, privacy policy)
6. Submit for review (2–7 days)

### Apple App Store
1. Build in Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Go to appstoreconnect.apple.com
4. Create new app
5. Fill in all metadata + screenshots
6. Submit for review (1–3 days)

---

## Legal Requirements (India)

For a location tracking app operating in India you **must** have:

1. **Explicit opt-in consent** — each member must tap "I agree to be tracked" before any location is shared. This is already built into the auth flow.

2. **Privacy Policy** — must include:
   - What data you collect (GPS coordinates, speed, battery)
   - How long you store it (90 days, configured in the DB)
   - Who can see it (only family members in the same group)
   - How to delete data (add a "Delete My Data" button in settings)

3. **Data Deletion** — users must be able to delete all their data. Add this API route:
```js
router.delete('/me/data', auth, async (req, res) => {
  await Location.deleteMany({ userId: req.user._id });
  await Stoppage.deleteMany({ userId: req.user._id });
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: 'All data deleted' });
});
```

4. **Terms of Service** — clearly state the app is for consensual family use only, not surveillance.

Use https://getterms.io to generate a starting template.

---

## Estimated Costs (Production, 100 users)

| Service | Cost/month |
|---------|-----------|
| Railway (backend) | $5 |
| MongoDB Atlas M2 | $9 |
| Twilio OTP (100 verifications) | ~$3 |
| Firebase (push notifications) | Free |
| Domain name | $1 |
| **Total** | **~$18/month** |

Scale to 1000 users → ~$60/month.

---

## Quick Summary: Complete Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Mobile | React Native | One codebase for iOS + Android |
| Web | React + Leaflet | Fast map, lightweight |
| Backend | Node.js + Express | Fast, huge ecosystem |
| Real-time | Socket.IO | WebSocket for live updates |
| Database | MongoDB Atlas | Flexible, geo-queries built-in |
| Cache | Redis | Store last-known location fast |
| Auth | JWT + Twilio OTP | Phone number = SIM verification |
| Push | Firebase FCM | Free, reliable push notifications |
| Hosting | Railway + Vercel | Deploy in minutes |
| Maps | Leaflet (web), react-native-maps (mobile) | Free, no usage limits |
