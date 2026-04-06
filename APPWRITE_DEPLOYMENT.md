# Appwrite Deployment Guide for TherapyAI

## Overview
Your AI-Powered Physical Therapy application is ready to be deployed to Appwrite Cloud. All necessary configuration files have been prepared.

## What's Been Configured

### 1. **Frontend (Vite React App)**
- Location: `dist/` folder
- Configuration: `appwrite.json` (sites section)
- Deployment strategy: Static site with SPA support
- File: `dist/200.html` (for client-side routing)

### 2. **Backend (Python FastAPI)**
- Location: `functions/api/` folder
- Configured as: Appwrite Function (serverless)
- Runtime: Python 3.9
- Endpoint URL: `https://fra.cloud.appwrite.io/v1/functions/therapy-api`

### 3. **Project Configuration**
- **Project ID**: `69cbd0c14ee4ee5de252`
- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **Organization**: Personal projects

## Deployment Steps

### Option 1: One-Click Deployment (Recommended)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# 1. Create/update build
npm run build

# 2. Login to Appwrite
appwrite login

# 3. Initialize project
appwrite init project
# Select: Link directory to existing project > Personal projects > 69cbd0c14ee4ee5de252

# 4. Deploy using appwrite push
appwrite push
```

## After Deployment

### 1. Check Frontend Deployment
- Go to: https://cloud.appwrite.io
- Navigate to: Settings > Domains
- You'll see your site URL (e.g., `https://therapy-ai-xxxxx.appwrite.io`)

### 2. Configure Backend API
Update your frontend's API configuration:
```typescript
// src/services/api.ts
const API_URL = 'https://fra.cloud.appwrite.io/v1/functions/therapy-api';
```

### 3. Set Environment Variables
In Appwrite Console:
1. Go to Functions > therapy-api > Settings
2. Add variables:
   - `CORS_ORIGINS`: `*` (or your frontend domain)
   - `DATABASE_URL`: (if needed)

### 4. Test the Deployment
```bash
# Test frontend (should load without errors)
curl https://your-site-url.appwrite.io

# Test backend function
curl https://fra.cloud.appwrite.io/v1/functions/therapy-api
```

## Project Structure

```
AI-Powered_Physical_Therapy-main/
├── appwrite.json                 # ✅ Appwrite configuration (updated)
├── deploy.sh                      # ✅ Automated deployment script
├── dist/                          # ✅ Built frontend
│   ├── index.html
│   ├── 200.html                  # ✅ SPA routing support
│   └── assets/
├── functions/
│   └── api/
│       └── main.py               # ✅ Backend function wrapper
├── src/
│   ├── appwriteConfig.js         # ✅ Frontend Appwrite SDK config
│   └── services/api.ts
└── backend/
    ├── main.py                   # FastAPI application
    └── requirements.txt
```

## Important Notes

### Frontend
- ✅ Pre-built and ready to deploy
- ✅ SPA routing configured (200.html)
- ✅ Appwrite SDK integrated (`appwriteConfig.js`)

### Backend
- The FastAPI backend is wrapped as an Appwrite Function
- It will run as a serverless function with 30-second timeout
- For long-running tasks, you may need to split into multiple functions

### CORS
- Configured to allow all origins (`*`)
- Can be restricted to your frontend domain after deployment

## Troubleshooting

### Authentication Issues
If `appwrite login` fails:
1. Check your Appwrite credentials at https://cloud.appwrite.io
2. Reset your password if needed
3. Ensure you're using the correct email address

### Build Errors
```bash
npm install
npm run build
```

### Deploy Errors
```bash
appwrite logout
appwrite login
appwrite push
```

## Support
- Appwrite Docs: https://appwrite.io/docs
- Appwrite Console: https://cloud.appwrite.io
- Project Settings: https://cloud.appwrite.io/console/projects/69cbd0c14ee4ee5de252

---

**Status**: ✅ Ready for Deployment
**Next Step**: Run `./deploy.sh` to deploy to Appwrite
