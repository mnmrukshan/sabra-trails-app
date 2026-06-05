# 🌿 SabraTrails — Eco-Tourism & Hiker Safety Mobile App

> A full-stack cross-platform mobile application designed to solve local eco-tourism challenges by mapping hidden trails, providing real-time weather alerts, and ensuring hiker safety.

---

## 🎥 App Demo Video

Click on the image below to watch the full mobile app demonstration on YouTube:

[![SabraTrails App Demo](https://img.youtube.com/vi/T5FSGj4aVlQ/maxresdefault.jpg)](https://youtu.be/T5FSGj4aVlQ)

*(Or [click here](https://youtu.be/T5FSGj4aVlQ) to watch the video directly)*

---

## 📖 The Inspiration

As a Software Engineering undergraduate at Sabaragamuwa University of Sri Lanka, I spent much of my time exploring the breathtaking natural landscapes surrounding our campus. I realized that many incredible, hidden trails remain unknown to regular travelers, and hikers frequently face major frustration and safety risks due to unpredictable local weather patterns.

To solve this real-world problem, I built SabraTrails. While the current database focuses on mapping the breathtaking trails across Sri Lanka's Central Highlands and surrounding eco-tourism hotspots, the architecture is designed to seamlessly scale and cover the entire island.

---

## 🚀 Key Features

* 🔐 **Secure Authentication (WSO2):** Identity management and secure user login powered by **WSO2 Asgardeo** using the OIDC/PKCE Flow.
* 🤖 **Context-Aware AI Chatbot:** An integrated safety assistant powered by **Google Gemini AI** to provide personalized hiking recommendations, gear checklists, and safety guidance.
* 🗺️ **Interactive Maps & GPS:** Integrated Google Maps routing for live directions and accurate distance calculations to trailheads.
* 🌤️ **Live Weather Alerts:** Real-time local climate data fetching via the Open-Meteo API to prevent hikers from getting caught in dangerous weather.
* 📸 **Community Lens:** A shared cloud gallery (Cloudinary) allowing hikers to upload, categorize, and share nature photography.
* 💾 **Local Storage & Session Management:** Secure persistence of user profiles and saved trails using React Native local storage.

---

## 💻 Technology Stack

### Frontend (Mobile App)
* **Framework:** React Native, Expo
* **Language:** TypeScript
* **Styling:** Custom StyleSheet (Glassmorphism & Parallax UI)

### Backend (API & Server)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas (NoSQL)

### Integrations & Security
* **Identity Provider:** WSO2 Asgardeo (OAuth 2.0 / OIDC)
* **AI Engine:** Google Gemini API
* **Media Storage:** Cloudinary
* **Location/Weather:** Google Maps SDK, Open-Meteo API

---

## 📂 Project Structure

```text
├── backend/        # Node.js + Express API server, routes, and DB models
└── frontend/       # React Native + Expo Mobile Application
```

---

## ⚙️ Getting Started (Local Development)

If you wish to run this project locally, follow these steps:

### Prerequisites
* Node.js installed
* Expo CLI installed (`npm install -g expo-cli`)
* MongoDB cluster URL
* WSO2 Asgardeo Tenant Setup

### 1. Clone the repository
```bash
git clone https://github.com/mnmrukshan/sabra-trails-app.git
cd sabra-trails-app
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory and add the following:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
WSO2_CLIENT_ID=your_wso2_asgardeo_client_id
```

### 3. Setup the Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Setup the Frontend
```bash
cd ../frontend
npm install
npx expo start
```

---
*Designed and Developed by M.N.M Rukshan - Sabaragamuwa University of Sri Lanka.*
