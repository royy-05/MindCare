# 🌿 MindCare - Premium Full-Stack Mental Health Companion

**Live Demo:** [mindcare-oqoo.onrender.com](https://mindcare-oqoo.onrender.com/)

MindCare is a modern, responsive, full-stack mental health application designed to provide anonymous peer support, AI-powered conversational guidance, self-assessments, and professional therapist booking.

Designed with a premium **glassmorphic UI**, fluid micro-animations, and unified layout styling, the platform is optimized for both desktop and mobile environments.

---

## 🚀 Key Features

* 💬 **AI Mental Health Chatbot:** Integrates the Google Gemini API to offer compassionate, real-time conversational support. Includes API rate-limiting for DDoS safety.
* 📋 **PHQ-9 Mental Health Assessments:** Dynamic, interactive self-assessments with instant diagnostic feedback and recommendations.
* 👥 **Peer Support Feed:** An anonymous storytelling space where users can read, publish, like, and flag mental health journeys across different categories.
* 📅 **Therapist Booking:** Translucent glassmorphic calendar interface allowing users to browse therapists and book slots.
* 🌿 **Resources Directory:** A modern curated repository of mental health articles, hotlines, and tools.
* 🔒 **Vulnerability Fixes & Security:**
  * Protected database indexes against duplication.
  * Secured private therapist booking records behind auth middleware.
  * Added ReDoS protection by escaping search patterns.
  * Configured hourly rate-limiting on the AI assistant.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), Modern Vanilla JS
* **APIs & Security:** Google Gemini API, JSON Web Tokens (JWT) for authentication, Helmet for security headers, CORS for request validation

---

## ⚙️ Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (running locally or cloud cluster)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/royy-05/MindCare.git
   cd MindCare
   ```

2. Install dependencies for the backend:
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file inside the `backend` folder:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mindcare
   JWT_SECRET=your_jwt_secret_token
   GEMINI_API_KEY=your_google_gemini_api_key
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm start
   ```
   Open your browser to `http://localhost:5000` to view the app!

---

## 🌐 Production Deployment

This project is configured to run fully on platforms like **Render** or **Railway**:

1. **Root Directory:** Set to `backend`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. **Environment Variables:** Provide your cloud `MONGODB_URI` (from MongoDB Atlas), `JWT_SECRET`, `GEMINI_API_KEY`, and set `NODE_ENV=production`.
