<div align="center">

<img src="https://img.shields.io/badge/LivGuard-Family%20Safety%20Tracker-blueviolet?style=for-the-badge&logo=shield&logoColor=white" alt="LivGuard Banner" />

# 🛡️ LivGuard — Real-Time Family Safety Tracker

### *Know where your loved ones are. Always. Instantly. Securely.*

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-liv--guard.vercel.app-22c55e?style=for-the-badge)](https://liv-guard.vercel.app)
[![Backend API](https://img.shields.io/badge/⚙️%20Backend%20API-livguard.onrender.com-3b82f6?style=for-the-badge)](https://livguard.onrender.com)
[![Made with React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Deployed on Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [What is LivGuard?](#-what-is-livguard)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Deployment Architecture](#-deployment-architecture)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

---

## ❗ Problem Statement

In today's fast-paced world, families are often spread across cities, campuses, and workplaces. Parents worry about children commuting late at night. Elderly family members may wander or need assistance. Friends want to coordinate meetups safely.

Existing solutions either:
- Require expensive hardware (GPS devices)
- Lock features behind paywalls
- Compromise user privacy with always-on tracking
- Lack real-time responsiveness

**LivGuard solves this** by providing a lightweight, browser-based, consent-first location sharing system — no app install required, no subscription fees, and no hidden tracking. It works anywhere in the world, on any device with a browser.

> *Your family's safety shouldn't depend on a monthly subscription.*

---

## 🌍 What is LivGuard?

**LivGuard** is a full-stack, real-time web application that enables trusted family members to share and view live locations securely through an interactive map interface.

Built with a modern **React + Node.js + MongoDB** stack and deployed on cloud platforms, LivGuard demonstrates production-grade engineering: secure JWT-based authentication, RESTful API design, real-time geolocation, and a responsive map UI — all accessible from any browser, anywhere in the world.

---

## 🔗 Live Demo

| Service | URL | Platform |
|--------|-----|----------|
| 🖥️ Frontend | [https://liv-guard.vercel.app](https://liv-guard.vercel.app) | Vercel |
| ⚙️ Backend API | [https://livguard.onrender.com](https://livguard.onrender.com) | Render |

> ⚠️ **Note:** The backend is hosted on Render's free tier. It may take **15–30 seconds** to wake up on first request. Please be patient on cold starts.

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 📍 | **Live Location Tracking** | Tracks user's real-time GPS coordinates using the browser Geolocation API |
| 🔐 | **OTP-Based Authentication** | Secure login flow using a one-time password system with JWT session tokens |
| 👨‍👩‍👧 | **Family Member System** | Add and manage trusted family members to share location with |
| 🗺️ | **Interactive Map UI** | Beautiful, zoomable Leaflet.js map with live location pins and labels |
| 🔄 | **Real-Time Updates** | Location refreshes continuously while the session is active |
| 🌐 | **Globally Accessible** | Fully deployed — works from any device, any browser, anywhere |
| 📱 | **Responsive Design** | Optimized for both desktop and mobile browsers |
| 🔒 | **Consent-First Model** | Location is only shared when the user explicitly grants browser permission |

---

## ⚙️ How It Works
