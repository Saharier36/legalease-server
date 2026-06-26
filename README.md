<h1 align="center">⚖️ LegalEase — Backend REST API</h1>
<p align="center"><strong>Robust Legal Service Marketplace Server</strong></p>

<p align="center">
  <a href="https://legalease-server-zeta.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20API-LegalEase%20Server-22c55e?style=flat-square&logo=vercel&logoColor=white" alt="Live API" />
  </a>
  <a href="https://legalease-lovat.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Client-LegalEase-3b82f6?style=flat-square&logo=vercel&logoColor=white" alt="Live Client" />
  </a>
  <a href="https://github.com/Saharier36/legalease-server" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Server-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub Server" />
  </a>
  <a href="https://github.com/Saharier36/legalease-client" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Client-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub Client" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/cors-2.8.6-007acc?style=flat-square" alt="cors" />
  <img src="https://img.shields.io/badge/dotenv-17.4.2-ECD53F?style=flat-square&logo=dotenv&logoColor=black" alt="dotenv" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Server-Side Features](#server-side-features)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Project Directory Structure](#project-directory-structure)
- [Local Installation & Setup](#local-installation--setup)

---

## Overview

LegalEase is a **legal service marketplace** platform connecting clients with legal professionals. This repository contains the **backend REST API** — the core engine that handles business logic, database management, secure authentication, and data endpoints that power the [LegalEase client application](https://legalease-lovat.vercel.app).

---

## Server-Side Features

### 🔐 Role-Based Access Control (RBAC)

Granular middleware-level access control enforcing distinct permission boundaries for **Clients**, **Lawyers**, and **Admins**. Middleware functions (`verifyUser`, `verifyLawyer`, `verifyAdmin`) inspect the authenticated user's role before granting access to protected routes.

### 💼 Lawyer Monetization Flow

Secure payment tracking infrastructure for legal services. When a client hires a lawyer and the request is accepted, the client completes payment — tracked via Stripe session IDs and recorded in a dedicated transactions collection. A lawyer's availability status (`Available` / `Busy`) is dynamically calculated based on the number of active accepted hires.

### 📦 Database Management (CRUD Ecosystem)

Full REST API routes for:
- **Service listing management** — lawyers can create, read, update, delete, and toggle visibility of their service offerings
- **Hiring workflows** — clients submit hiring requests; lawyers accept or reject them
- **User management** — admins can view, update roles, and remove users
- **Analytics** — admin dashboard with aggregate metrics (total users, lawyers, hires, revenue)

### ⭐ Review & Interaction System

Clients who have hired a lawyer can submit, edit, and delete **comments/ratings** on their hired legal professionals. Comments are limited to 200 characters and are associated with both the lawyer and the user who wrote them.

### 🔒 Authentication & Security

**Session-based authentication** using the `session` collection. Tokens issued at login are stored server-side and validated on each protected request. Social login flows write user data and session records, which the token verification middleware (`verifyToken`) checks before granting access to any protected route.

---

## Tech Stack

| Technology       | Purpose                         |
|------------------|---------------------------------|
| **Node.js**      | JavaScript runtime              |
| **Express.js**   | HTTP server & routing           |
| **MongoDB**      | NoSQL database (native driver)  |
| **cors**         | Cross-Origin Resource Sharing   |
| **dotenv**       | Environment variable management |

---

## API Endpoints

### Lawyer Services

| Method   | Endpoint                     | Auth             | Description                   |
|----------|------------------------------|------------------|-------------------------------|
| `GET`    | `/api/lawyer/services`       | —                | List services (with filters/sort/search) |
| `GET`    | `/api/lawyer/services/:id`   | —                | Get single service            |
| `POST`   | `/api/lawyer/services`       | `verifyLawyer`   | Create a new service          |
| `PATCH`  | `/api/lawyer/services/:id`   | `verifyLawyer`   | Update a service              |
| `DELETE` | `/api/lawyer/services/:id`   | `verifyLawyer`   | Delete a service              |

### Hirings

| Method   | Endpoint                          | Auth              | Description                          |
|----------|-----------------------------------|-------------------|--------------------------------------|
| `POST`   | `/api/hirings`                    | `verifyUser`      | Submit a hiring request              |
| `GET`    | `/api/hirings/check`              | `verifyToken`     | Check if user has hired a lawyer     |
| `GET`    | `/api/hirings`                    | `verifyToken`     | List hirings (by `lawyerId` or `userId`) |
| `PATCH`  | `/api/hirings/:id/payment`        | `verifyToken`     | Record payment for an accepted hire  |
| `PATCH`  | `/api/hirings/:id/status`         | `verifyLawyer`    | Accept or reject a hiring request    |

### Comments

| Method   | Endpoint                    | Auth             | Description                       |
|----------|-----------------------------|------------------|-----------------------------------|
| `POST`   | `/api/comments`             | `verifyToken`    | Submit a comment                  |
| `GET`    | `/api/comments`             | —                | Get comments for a lawyer         |
| `PATCH`  | `/api/comments/:id`         | `verifyToken`    | Edit own comment (owner only)     |
| `DELETE` | `/api/comments/:id`         | `verifyToken`    | Delete own comment (owner only)   |
| `GET`    | `/api/comments/user`        | `verifyToken`    | Get all comments by a user        |

### Users (Admin)

| Method   | Endpoint                   | Auth              | Description                |
|----------|----------------------------|-------------------|----------------------------|
| `GET`    | `/api/users`               | `verifyAdmin`     | List all users             |
| `PATCH`  | `/api/users/:id/role`      | `verifyAdmin`     | Update user role           |
| `DELETE` | `/api/users/:id`           | `verifyAdmin`     | Delete a user              |

### Transactions & Analytics

| Method   | Endpoint                    | Auth              | Description                        |
|----------|-----------------------------|-------------------|------------------------------------|
| `GET`    | `/api/transactions`         | `verifyAdmin`     | List all payment transactions      |
| `GET`    | `/api/admin/analytics`      | `verifyAdmin`     | Aggregate platform statistics      |

---

## Project Directory Structure

```
legalease-server/
├── index.js              # Server entry point — routes, middleware, DB setup
├── package.json          # Project metadata & dependencies
├── vercel.json           # Vercel deployment configuration
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation (this file)
```

> The entire application is contained in a single `index.js` file — all routes, middleware, and database logic are defined there for simplicity and ease of deployment.

---

## Local Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB](https://www.mongodb.com/) instance (local or Atlas)
- A package manager (`npm`)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Saharier36/legalease-server.git
cd legalease-server
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
DB_NAME=legalease
```

Replace the placeholders with your actual MongoDB connection string and database name.

### Step 4: Start the Server

**Development mode** (with auto-restart via Nodemon):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

> **Note:** The server does not have a `start` script defined in `package.json` by default. You can start it directly with `node index.js`, or add a `"start": "node index.js"` script to `package.json`.

### Step 5: Verify

Open a browser or API client and visit:

```
http://localhost:5000/
```

You should see: **"LegalEase Server is running smoothly!"**

---

## Deployment

This server is configured for deployment on **Vercel** via the `vercel.json` configuration file. The live instance is available at:

👉 [https://legalease-server-zeta.vercel.app](https://legalease-server-zeta.vercel.app)

---

<p align="center">
  Built by ❤️ Saharier Omi
</p>
