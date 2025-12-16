# EasyPanel Deployment Guide

This guide explains how to deploy the Crypto Portfolio application on your VPS using EasyPanel.

## 📋 Overview

The application consists of 3 services:
- **PostgreSQL Database** (Port 5432)
- **Backend API** (Port 3000) - Node.js/Express
- **Frontend** (Port 80) - React with Nginx

## 🚀 Deployment Steps on EasyPanel

### 1. Prerequisites

- EasyPanel installed on your VPS
- Git repository URL (GitHub/GitLab)
- Domain names (optional but recommended):
  - `api.yourdomain.com` → Backend
  - `app.yourdomain.com` → Frontend

### 2. Deploy PostgreSQL Database

1. In EasyPanel, create a new **PostgreSQL** service
2. Configure:
   - Name: `crypto-portfolio-db`
   - Version: `15-alpine`
   - Database: `crypto_portfolio`
   - Username: `postgres`
   - Password: (generate a strong password)
3. Note the connection details for the backend

### 3. Deploy Backend API

1. Create a new **App** in EasyPanel
2. Select **GitHub/GitLab** as source
3. Configure:
   - **Name**: `crypto-portfolio-backend`
   - **Repository**: Your Git repo URL
   - **Branch**: `main` or `master`
   - **Build Path**: `crypto-portfolio/backend`
   - **Dockerfile**: Uses `./Dockerfile` (auto-detected)
   - **Port**: `3000`

4. Add **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=crypto-portfolio-db
   DB_PORT=5432
   DB_NAME=crypto_portfolio
   DB_USER=postgres
   DB_PASSWORD=<your-db-password>
   JWT_SECRET=<generate-a-strong-secret-min-32-chars>
   ```

5. **Domain** (optional):
   - Add domain: `api.yourdomain.com`
   - Enable HTTPS (Let's Encrypt)

6. Deploy and wait for build to complete

### 4. Deploy Frontend

1. Create another new **App** in EasyPanel
2. Select **GitHub/GitLab** as source
3. Configure:
   - **Name**: `crypto-portfolio-frontend`
   - **Repository**: Same Git repo URL
   - **Branch**: `main` or `master`
   - **Build Path**: `crypto-portfolio/frontend`
   - **Dockerfile**: Uses `./Dockerfile` (auto-detected)
   - **Port**: `80`

4. Add **Build Arguments** (important!):
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```
   Or if not using custom domain:
   ```
   VITE_API_URL=https://<backend-app-url>.easypanel.host
   ```

5. **Domain** (optional):
   - Add domain: `app.yourdomain.com`
   - Enable HTTPS (Let's Encrypt)

6. Deploy and wait for build to complete

## 🔧 Configuration Details

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `crypto-portfolio-db` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `crypto_portfolio` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `JWT_SECRET` | JWT secret key (32+ chars) | `your-secret-key` |

### Frontend Build Arguments

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com` |

**Important**: The `VITE_API_URL` must be set during **build time** as a build argument, not as an environment variable!

## 🔐 Security Checklist

- [ ] Use strong PostgreSQL password (20+ characters)
- [ ] Use strong JWT secret (32+ characters, random)
- [ ] Enable HTTPS for both frontend and backend
- [ ] Use custom domains instead of EasyPanel subdomains (recommended)
- [ ] Never commit `.env` files to Git
- [ ] Regularly update dependencies

## 📊 Database Migrations

Migrations run automatically on backend startup. The `Dockerfile` includes:
```dockerfile
CMD ["sh", "-c", "npm run migrate && npm start"]
```

This ensures the database schema is created/updated every time the backend starts.

## 🧪 Testing the Deployment

1. **Backend Health Check**:
   ```
   curl https://api.yourdomain.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend Health Check**:
   ```
   curl https://app.yourdomain.com/health
   ```
   Should return: `healthy`

3. **Full Flow Test**:
   - Visit `https://app.yourdomain.com`
   - Register a new account
   - Add a wallet address
   - Fetch portfolio data

## 🔄 Updating the Application

### Method 1: Git Push (Automatic)

If you enabled auto-deploy in EasyPanel:
1. Push changes to your Git repository
2. EasyPanel automatically rebuilds and redeploys

### Method 2: Manual Deploy

In EasyPanel dashboard:
1. Go to your app
2. Click "Deploy" button
3. Wait for rebuild

## 🐛 Troubleshooting

### Backend fails to start
- Check logs in EasyPanel
- Verify database connection (DB_HOST, DB_PASSWORD)
- Ensure JWT_SECRET is set

### Frontend can't connect to backend
- Verify `VITE_API_URL` is correct
- Check CORS is enabled on backend
- Ensure backend is running and accessible

### Database connection errors
- Verify PostgreSQL service is running
- Check DB credentials match
- Ensure backend can reach database (same network)

## 📝 Alternative: Using Docker Compose

If you prefer to use Docker Compose instead of EasyPanel's UI:

1. SSH into your VPS
2. Clone the repository
3. Navigate to the crypto-portfolio directory:
   ```bash
   cd crypto-portfolio
   ```
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Update `.env` with production values (edit with nano/vim)
6. Build and start all services:
   ```bash
   docker-compose up -d --build
   ```
7. Check logs:
   ```bash
   docker-compose logs -f
   ```

## 🎯 Production URLs

After deployment, you'll have:
- Frontend: `https://app.yourdomain.com` (or EasyPanel subdomain)
- Backend: `https://api.yourdomain.com` (or EasyPanel subdomain)
- Database: Internal only (not exposed to internet)

## 📞 Support

For issues:
1. Check EasyPanel logs
2. Check application logs
3. Review this guide
4. Check GitHub issues

---

**Important Notes**:
- Always use HTTPS in production
- Keep your JWT_SECRET and database passwords secure
- Regular backups of PostgreSQL database recommended
- Monitor resource usage in EasyPanel dashboard
