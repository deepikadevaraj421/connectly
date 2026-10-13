# ⚡ Connectly — Modern Social Networking & Messaging Platform

Connectly is a full-stack, high-performance social networking platform built with **FastAPI**, **PostgreSQL**, **WebSockets**, **React (Vite)**, and **Tailwind CSS**. It features rich interactive social feeds, real-time 1-on-1 messaging, creator communities, and instant notifications.

---

## 🌟 Highlights & Key Features

- **⚡ Real-Time Messaging**: Instant direct messages powered by WebSockets, featuring live typing indicators and online presence tracking.
- **📰 Interactive Media Feed**: Post creation with image uploads, double-click animated hearts, emoji reactions, and expandable comment threads.
- **👥 Spaces & Communities**: Explore and join niche spaces for design, coding, photography, AI, music, and more.
- **🔔 Live Notifications**: Real-time activity notifications for likes, comments, follows, and messages.
- **🎨 Modern Design**: Custom design system built with vibrant gradients, dark/light theme toggle, glassmorphism, and Framer Motion micro-interactions.
- **🔒 Secure Authentication**: JWT authentication with direct Bcrypt encryption, profile customization, and settings management.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, high-performance web framework for Python.
- **PostgreSQL & SQLAlchemy 2.0**: Relational database schema with UUID keys, joins, and relationships.
- **WebSockets**: Real-time bi-directional message dispatch.
- **Bcrypt**: Robust, secure password hashing.
- **Uvicorn**: Lightning-fast ASGI server.

### Frontend
- **React 19 & Vite**: Ultra-fast build tool and frontend runtime.
- **Tailwind CSS**: Utility-first styling supplemented with custom CSS tokens.
- **Framer Motion**: Smooth page transitions and fluid micro-interactions.
- **Zustand**: Lightweight global state management for auth and theme.
- **Lucide Icons**: Clean, consistent icon set.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL running locally (default: `localhost:5432`)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials if different

# Seed database with demo accounts & posts
python -m app.seed

# Start backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API docs will be live at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend will be running at `http://localhost:5173`.*

---

## 🔑 Demo Accounts

The database comes pre-seeded with creators (password for all demo accounts: `password123`):

| Email | Password | Role / Username |
| :--- | :--- | :--- |
| `alice@connectly.io` | `password123` | `@alicechen` — UI/UX Designer |
| `bob@connectly.io` | `password123` | `@bobmartinez` — Full-Stack Developer |
| `carol@connectly.io` | `password123` | `@carolpark` — Photographer |
| `dave@connectly.io` | `password123` | `@davewilson` — Music Producer |

---

## 📄 License
MIT License. Built with ❤️ for community builders and creators.
