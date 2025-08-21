#AMUHACKS 4.0 #CSSAMU #AMU
# 🗑️ Smart Waste Management System

A web application designed to improve waste collection efficiency and promote sustainable practices by engaging both citizens and administrators through a digital platform.

## 🚀 Features

### 👤 User Roles

#### 1. **Admin**
- Approve/Reject waste pickup requests
- Monitor bin statuses and locations using **Leaflet.js**
- Manage citizen users
- Create and manage pickup schedules
- Configure system settings

#### 2. **Citizen**
- Dashboard showing:
  - Eco Points (rewards for reporting waste)
  - Total pickups, pending, and scheduled pickups
- Submit waste pickup requests (with **Google Vision API** based image detection)
- View nearby recycling centers on a map
- Access waste management guides and rewards info
- Manage personal profile

---

## 🛠️ Tech Stack

| Layer       | Technology                        |
|-------------|------------------------------------|
| Frontend    | React.js, Tailwind CSS             |
| Backend     | Node.js, Express.js                |
| Database    | PostgreSQL                         |
| ORM         | Prisma                             |
| Auth        | JWT                                |
| Map         | Leaflet.js                         |
| Image AI    | Google Vision API                  |
| State/API   | React Context API, React Query     |
| Deployment  | Vercel (Frontend), Render (Backend) |

---

## 📦 Getting Started

### Prerequisites
- Node.js and npm
- PostgreSQL
- Google Cloud Vision API key

### Clone the Repository
```bash
git clone https://github.com/Kuldeep12mohan/404found_AMUHACKS4.0.git
cd 404found_AMUHACK4.0
