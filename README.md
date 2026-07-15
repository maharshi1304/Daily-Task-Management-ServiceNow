# 🚀 Daily Task Management System ServiceNow

A full-stack IT Service Desk task management application inspired by ServiceNow workflows. It enables managers and agents to efficiently manage incidents, service requests, work notes, and resolutions with secure role-based access control.

---

## 📋 Table of Contents

- Demo Accounts

- Features

- Technology Stack

- Project Architecture

- Repository Structure

- Database Schema

- API Endpoints

- Authentication & Authorization

- Frontend Pages

- Data Flow

- Environment Variables

- Installation

- Database Migration

- Screenshots

- Future Enhancements

- License

---

# 👥 Demo Accounts

| Role | Username | Password | Access |

|------|----------|----------|--------|

| Manager | manager | manager123 | Full system access |

| Agent | agent1 | agent123 | Own records only |

| Agent | agent2 | agent123 | Own records only |

---

# ✨ Features

## 🎫 Incident Management

- Create Incident Tickets (INC000001)

- Priority Management

- Category & Configuration Item

- Status Tracking

- Assigned Groups

---

## 📄 Service Requests

- RITM Ticket Generation

- Service Categories

- Assignment Groups

- Status Tracking

---

## 📝 Work Notes

- Add Notes

- Track Hours Worked

- Link Notes to Tickets

- Activity Timeline

---

## ✅ Resolution Management

- Resolution Codes

- Resolution Notes

- Ticket Closure

---

## 📊 Dashboard

- Today's Incident Count

- Service Request Count

- Work Notes Summary

- Recent Activities

- Quick Create Dialogs

---

## 👨‍💼 Team Overview (Manager)

- Team Performance

- User Activity

- Daily Work Summary

- Account Management

- Reset Password

- Delete User

---

## 🔒 Authentication

- Session-based Login

- Password Hashing

- Role-based Authorization

- Protected Routes

---

# 🛠 Technology Stack

| Layer | Technology |

|---------|------------|

| Frontend | React 18 |

| Language | TypeScript |

| Build Tool | Vite |

| Routing | Wouter |

| Data Fetching | TanStack Query |

| Styling | Tailwind CSS |

| Backend | Node.js |

| Framework | Express.js |

| Database | PostgreSQL |

| ORM | Drizzle ORM |

| Authentication | Express Session |

| Password Security | bcryptjs |

| Validation | Zod |

| Logger | Pino |

| Package Manager | pnpm |

---

# 📂 Repository Structure
~~~~

Daily-Task-Management/

│

├── client/

│   ├── public/

│   ├── src/

│   │   ├── components/

│   │   ├── pages/

│   │   ├── hooks/

│   │   ├── context/

│   │   ├── services/

│   │   ├── utils/

│   │   └── App.tsx

│

├── server/

│   ├── routes/

│   ├── middleware/

│   ├── controllers/

│   ├── services/

│   ├── db/

│   └── index.ts

│

├── shared/

│   ├── schema.ts

│   └── types.ts

│

├── drizzle/

├── package.json

├── pnpm-lock.yaml

├── tsconfig.json

├── vite.config.ts

└── README.md
~~~~

# 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (User)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               Replit Shared Reverse Proxy                       │
│  Path-based routing:                                            │
│    /           ──► taskmanager  (Vite dev server, port $PORT)   │
│    /api/*      ──► api-server   (Express,         port 8080)    │
└───────────┬─────────────────────────┬───────────────────────────┘
            │                         │
            ▼                         ▼
┌───────────────────┐      ┌──────────────────────────────────────┐
│  React SPA        │      │  Express API Server                  │
│  (Vite / React)   │      │                                      │
│                   │      │  Middleware stack (top → bottom):    │
│  AuthProvider     │      │    pino-http  (request logging)      │
│    └ /auth/me ───►│──────│    cors       (credentials: true)    │
│                   │      │    json body parser                  │
│  TanStack Query   │      │    express-session (cookie auth)     │
│    └ stale 30s    │      │                                      │
│                   │      │  Router  /api/*                      │
│  Wouter Router    │      │    /health                           │
│    └ pages below  │      │    /auth/login|logout|me             │
│                   │      │    /users                            │
│  fetch + cookie   │──────│    /incidents                        │
│  credentials:     │      │    /service-requests                 │
│  "include"        │      │    /work-notes                       │
└───────────────────┘      │    /resolutions                      │
                           │    /dashboard/summary|activity|team  │
                           └──────────────┬───────────────────────┘
                                          │ Drizzle ORM
                                          ▼
                           ┌──────────────────────────────────────┐
                           │  PostgreSQL (Replit managed)         │
                           │                                      │
                           │  Tables:                             │
                           │    users                             │
                           │    incidents                         │
                           │    service_requests                  │
                           │    work_notes                        │
                           │    resolutions                       │
                           └──────────────────────────────────────┘
```

Data Model
user
<img width="878" height="676" alt="image" src="https://github.com/user-attachments/assets/4cfb4e86-e963-48c1-9b46-d688e89585ad" />


incidents
<img width="1106" height="1044" alt="image" src="https://github.com/user-attachments/assets/35a2fdc4-4903-462d-bd66-d11e8a2d6f9e" />


service_requests
<img width="880" height="384" alt="image" src="https://github.com/user-attachments/assets/3ef8bf74-0f71-4026-95f2-9dfb9d271742" />


work_notes
<img width="658" height="314" alt="image" src="https://github.com/user-attachments/assets/1b154051-c1ba-43a6-afed-708a9c5824ff" />


resolutions
<img width="1232" height="344" alt="image" src="https://github.com/user-attachments/assets/4792bd3c-df72-427a-aabc-8decb9c40344" />


API Reference
All routes are prefixed /api. Every route except /health and /auth/login requires a valid session cookie.


Auth
<img width="1354" height="354" alt="image" src="https://github.com/user-attachments/assets/c3b48b96-3550-49b0-bccb-c2bd5ba0d28c" />


Users
<img width="1366" height="452" alt="image" src="https://github.com/user-attachments/assets/2b33b3a8-58a5-44c5-bbe6-9de7bb02428e" />



Incidents
<img width="1298" height="594" alt="image" src="https://github.com/user-attachments/assets/55724a98-d4a2-438c-a71f-5698d5df68a6" />



Dashboard
<img width="1328" height="372" alt="image" src="https://github.com/user-attachments/assets/24edd0bc-6efa-4a11-814e-ee345005ff92" />



# 🔐 Authentication Flow

```

User Login

      │

      ▼

Express Session

      │

      ▼

Cookie Created

      │

      ▼

Protected API

      │

      ▼

Role Validation

      │

      ▼

Response

```

---

# 🖥 Frontend Pages

- Login

- Dashboard

- Incidents

- Service Requests

- Work Notes

- Resolutions

- Team Overview

- Profile

---

# 🔄 Data Flow

```

React Form

      │

      ▼

Express API

      │

      ▼

Validation (Zod)

      │

      ▼

Drizzle ORM

      │

      ▼

PostgreSQL

      │

      ▼

JSON Response

      │

      ▼

React UI Update

```

---
Example: Manager views Team Overview
1. Manager navigates to /team
2. React calls api.get("/dashboard/team")
3. requireManager middleware confirms role === "manager"
4. dashboard/team handler:
   SELECT id, username, display_name FROM users
   For each user, run COUNT queries:
     incidents today / total, open
     service_requests today / total, open
     work_notes today / total
     resolutions today / total
5. Returns array of per-user stats
6. TeamPage renders stat cards
   "Today's Work" tab: fetches full /incidents & /work-notes,
   filters client-side by userId + today's date for expandable logs
   "Manage Accounts" tab: lists users, create/reset/delete dialogs

# ⚙ Environment Variables
Variable	Required	Description
DATABASE_URL	✅	PostgreSQL connection string (auto-set by Replit)
SESSION_SECRET	✅	Random secret for session cookie signing (set in Replit Secrets)
PORT	✅	Port for each service (auto-set per artifact by Replit)
BASE_PATH	✅	URL path prefix for the Vite app (auto-set by Replit)
NODE_ENV	—	development | production — controls secure cookie flag
Running Locally (VS Code)

# Prerequisites
Node.js 20+
pnpm 9+ (npm install -g pnpm)
A PostgreSQL database (local or cloud)
Setup

# 1. Clone the repo (from Replit Git or downloaded zip)
```
git git clone https://github.com/yourusername/Daily-Task-Management.git

```
cd <project-folder>

# 2. Install all workspace dependencies
pnpm install

# 3. Create a .env file in the project root
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/opslog
SESSION_SECRET=replace-with-a-long-random-string
NODE_ENV=development
EOF

# 4. Push the database schema (Drizzle)
pnpm --filter @workspace/db run push

# 5. Seed demo accounts

# Set DATABASE_URL in your shell, then:
cd artifacts/api-server

# (See seed-users approach in the repo or insert manually — see Data Model above)

# 6. Start the API server (terminal 1)
PORT=8080 pnpm --filter @workspace/api-server run dev

# 7. Start the React frontend (terminal 2)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/taskmanager run dev

Note on the API proxy: In Replit the shared reverse proxy routes /api/* to the api-server automatically. Locally you need to add a Vite proxy, or point the frontend at the api-server port directly. Add this to artifacts/taskmanager/vite.config.ts under server::

server: {
  proxy: {
    '/api': 'http://localhost:8080',
  }
}

# 🗃  Database Migrations
This project uses Drizzle Kit for schema management.

# Push schema changes to dev DB (non-destructive)
pnpm --filter @workspace/db run push

# Force push (drops/recreates columns — dev only)
pnpm --filter @workspace/db run push-force

# Generate SQL migration files (optional, if using migration-based flow)
cd lib/db && npx drizzle-kit generate

Schema source of truth: lib/db/src/schema/

# Key Design Decisions
<img width="1666" height="594" alt="image" src="https://github.com/user-attachments/assets/2933b344-64a8-4a34-b177-c38d63cdfaa7" />

# 🚀 Future Enhancements

- Email Notifications

- Microsoft Teams Integration

- File Attachments

- Audit Logs

- Dark Mode

- Dashboard Charts

- Export to Excel/PDF

- Multi-language Support

- Mobile Responsive UI

---

# 👨‍💻 Author

**Maharshi**

- B.Tech (Computer Science & Engineering)

- Tech Support L1 Engineer

- Aspiring Web-Devlopment/DevOps & Cloud Engineer

GitHub: https://github.com/maharshi1304

---
