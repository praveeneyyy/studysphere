# 🚀 StudySphere Deployment Guide

This guide outlines how to deploy the Next.js application along with the real-time Socket.IO and Hocuspocus collaboration servers to production.

---

## Architecture Overview

1. **Frontend & Server Actions (Next.js)**: Deployed to **Vercel** (serverless).
2. **Database (MongoDB)**: Managed MongoDB cluster (e.g., **MongoDB Atlas**).
3. **Chat Server (Socket.IO)**: Deployed to a traditional Node container service (e.g., **Render**, **Railway**, **Fly.io**).
4. **Collaboration Server (Hocuspocus)**: Deployed to a Node container service (e.g., **Render**, **Railway**, **Fly.io**).

---

## 1. Deploy the Databases & Auth Services

* **Clerk Auth**: In your Clerk dashboard, retrieve your production API Keys and set up your production redirect URLs.
* **MongoDB**: Create a database cluster in MongoDB Atlas and copy the connection URI string.

---

## 2. Deploy the WebSocket Servers (Socket.IO & Hocuspocus)

Since Vercel’s serverless functions do not support long-lived WebSocket connections, you must deploy the two Node background scripts on traditional hosting platforms like Render, Railway, or Fly.io.

### Option A: Render
1. Create a **Web Service** pointing to your GitHub repository.
2. Select **Node** runtime.
3. Configure settings for the **Socket.IO Chat Server**:
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `npx tsx server/socket-server.ts`
   - **Environment Variables**:
     - `MONGODB_URI`: Your MongoDB Atlas URI.
     - `PORT`: `3005` (or mapped by Render dynamically).
4. Configure settings for the **Hocuspocus Collaboration Server**:
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `npx tsx server/hocuspocus-server.ts`
   - **Environment Variables**:
     - `MONGODB_URI`: Your MongoDB Atlas URI.
     - `PORT`: `3006` (or mapped by Render dynamically).

---

## 3. Deploy the Next.js Frontend (Vercel)

1. Create a new project in **Vercel** and select the `clerk-nextjs` directory.
2. Add the following **Environment Variables**:

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Connection URI | `mongodb+srv://...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable key | Clerk Dashboard |
| `CLERK_SECRET_KEY` | Clerk Secret key | Clerk Dashboard |
| `CLERK_WEBHOOK_SECRET` | Clerk Sync Webhook Secret | Clerk Webhook Endpoint |
| `OPENAI_API_KEY` | AI tutor capability (Option 1) | OpenAI API |
| `GEMINI_API_KEY` | AI tutor capability (Option 2) | Google AI Studio |
| `NEXT_PUBLIC_SOCKET_URL` | Live URL of the Socket.IO Server | `https://studysphere-socket.onrender.com` |
| `NEXT_PUBLIC_HOCUSPOCUS_URL` | Live WebSocket URL of the Hocuspocus Server | `wss://studysphere-collab.onrender.com` |

3. Click **Deploy**. Vercel will automatically compile, optimize, and serve your application globally.

---

## 4. Setup Clerk Webhook Sync (Production)

To keep your users synced to MongoDB in production:
1. In your Clerk Dashboard, go to **Webhooks** and click **Add Endpoint**.
2. Set the Endpoint URL to: `https://your-nextjs-app.vercel.app/api/webhooks/clerk`.
3. Select the events `user.created`, `user.updated`, and `user.deleted`.
4. Copy the Webhook Signing Secret and add it as `CLERK_WEBHOOK_SECRET` in your Vercel project environment variables.
