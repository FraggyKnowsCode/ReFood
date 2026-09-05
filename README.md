# ReFood — Food Waste Management & Redistribution Platform

> A modern full-stack web application designed to track food waste, coordinate community reduction programs, and streamline food and fund donations to eliminate local food waste.

---

## The Problem & The Mission

A huge portion of good, edible food produced daily is discarded into landfills, while local communities and shelters face shortages. **ReFood** bridges this gap:
- Gives businesses, restaurants, and individuals an effortless way to **log and classify surplus food** before it spoils.
- Coordinates community **food reduction initiatives and rescue drives** with participating organizations.
- Provides a transparent **donation gateway** to fund logistics and storage for rescued food.
- Gives administrators clear **analytics and cost breakdown** to measure environmental and financial impact over time.

---

## Key Features

### 1. Real-Time Overview Dashboard
- High-level KPIs: Total Donations (in ৳ BDT), Active Reduction Programs, and Total Waste Entries.
- Interactive stats cards with percentage trends and dynamic visual accents.
- Responsive mobile drawer and quick notification drawer with live counts.

### 2. Food Waste Logging & Inventory
- Categorize waste entries: `Vegetables`, `Fruits`, `Cooked Meals`, `Dairy`, `Dry Goods`, and `Others`.
- Log weight/amount, cause of surplus, physical location, and disposal method (`Donation`, `Compost`, `Landfill`).
- One-click request system allowing verified partners to claim surplus food items directly.

### 3. Community Reduction Programs & Events
- Create, browse, and track active community food-saving campaigns.
- Displays start & end dates, organizer details, and participating NGOs or restaurants.
- Full details page with participant breakdowns and event milestones.

### 4. Transparent Donations Portal
- Process and track monetary donations with payment methods (bKash, Nagad, Card, Bank Transfer).
- Real-time donor activity feed and verified transaction ID logging.
- Admin review & verification workflow.

### 5. Cost & Impact Management
- Track logistical, transportation, and operational expenses across programs.
- Real-time aggregation of savings and net impact metrics.

### 6. Role-Based Access Control & Admin Panel
- Secure authentication powered by Supabase Auth (GoTrue).
- Granular permissions: Regular users can log data and donate; Admins can manage users, approve programs, verify transactions, and view cost audits.
- Dedicated user management table to promote/demote administrators or remove accounts.

### 7. Handcrafted Dark Glassmorphic Design
- Pure custom CSS without Tailwind overhead — sleek dark palette (`#0b0e14`), frosted glass cards (`backdrop-filter`), smooth micro-interactions, and custom gradients.
- Mobile-first responsiveness tested across devices with slide-out navigation and centered popovers.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 7, Lucide Icons, Axios |
| **Backend API** | Node.js, Express 5, CORS, Dotenv |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue JWT Auth, Realtime) |
| **Hosting & CI/CD** | Vercel (Unified SPA + Serverless API Functions) |
| **Styling** | Custom Vanilla CSS (Design Tokens, Glassmorphism, CSS Grid & Flexbox) |

---

## Project Architecture

```
ReFood/
├── api/                     # Vercel Serverless Function entrypoint
│   └── index.js             # Wraps Express backend for serverless execution
├── backend/                 # Node.js Express REST API
│   ├── routes/              # Modular Express routes
│   │   ├── costs.js         # Cost management endpoints
│   │   ├── donations.js     # Donation logging & approval
│   │   ├── feedback.js      # User feedback submissions
│   │   ├── food.js          # Food waste entries & claim requests
│   │   ├── programs.js      # Community reduction programs
│   │   └── users.js         # User profile & admin controls
│   ├── server.js            # Express application configuration & middleware
│   ├── supabaseClient.js    # Backend Supabase client (service role)
│   └── package.json
├── frontend/                # React + Vite Single Page App
│   ├── src/
│   │   ├── components/      # Page components & layouts
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FoodData.jsx
│   │   │   ├── ProgramsList.jsx
│   │   │   ├── DonationsPage.jsx
│   │   │   ├── CostManagement.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── Layout.jsx   # Header, sidebar & mobile navigation
│   │   │   └── ...
│   │   ├── App.jsx          # Routes & authentication guard
│   │   ├── AuthContext.jsx  # Supabase auth session provider
│   │   ├── api.js           # Axios client with automatic LAN & Prod switching
│   │   └── index.css        # Core design system & responsive styling
│   ├── package.json
│   └── vite.config.js
├── supabase_migration.sql   # Complete PostgreSQL schema & tables setup
├── vercel.json              # Vercel deployment & routing configuration
└── package.json             # Root scripts & dependencies
```

---

## Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- A free [Supabase](https://supabase.com/) project account

---

### 1. Clone the Repository
```bash
git clone https://github.com/FraggyKnowsCode/ReFood.git
cd ReFood
```

---

### 2. Configure Database (Supabase)
1. Open your Supabase Project Dashboard and navigate to the **SQL Editor**.
2. Open [supabase_migration.sql](./supabase_migration.sql) from this repository, copy the contents, and run it.
3. This creates all enum types, tables (`users`, `reduction_programs`, `food_waste_data`, `donations`, `cost_management`, `food_requests`, `feedback`), and relational foreign keys.

---

### 3. Environment Variables Setup

#### Backend (`backend/.env`):
Create a `.env` file in the `backend/` directory:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
PORT=5000
```

#### Frontend (`frontend/.env`):
Create a `.env` file in the `frontend/` directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 4. Install Dependencies & Run

#### Start Backend:
```bash
cd backend
npm install
npm run dev
```
Backend will start on `http://localhost:5000` (listening on `0.0.0.0` for local network access).

#### Start Frontend:
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`. You can also open the Network URL on your phone to test mobile responsiveness directly over Wi-Fi!

---

## REST API Reference

All protected endpoints require an `Authorization: Bearer <supabase_jwt>` header.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | User | Get aggregated system overview metrics |
| `POST` | `/api/auth/register` | Public | Auto-confirmed user registration |
| `GET` | `/api/programs` | User | List all reduction programs |
| `POST` | `/api/programs` | Admin | Create a new community initiative |
| `PUT` / `DELETE` | `/api/programs/:id` | Admin | Update or delete a program |
| `GET` | `/api/food` | User | List logged food waste entries |
| `POST` | `/api/food` | User | Log a new food waste / surplus item |
| `POST` | `/api/food/:id/request` | User | Claim surplus food for redistribution |
| `GET` | `/api/donations` | User | View all donations |
| `POST` | `/api/donations` | User | Submit a new donation entry |
| `GET` | `/api/costs` | Admin | View operational expenses |
| `POST` | `/api/costs` | Admin | Log an operational expense |
| `GET` | `/api/users` | Admin | Manage users and roles |
| `PUT` | `/api/users/:id` | Admin | Toggle admin privileges |
| `GET` / `POST` | `/api/feedback` | User | Read and submit platform feedback |

---

## Deployment to Vercel

This repository is pre-configured for a zero-maintenance single-project Vercel deployment:
1. Import this repository into [Vercel](https://vercel.com/new).
2. Set **Application Preset** to `Other` (or `Vite`).
3. Add the 4 environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel builds the frontend and exposes `/api/*` via Serverless Functions with automatic SSL.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
