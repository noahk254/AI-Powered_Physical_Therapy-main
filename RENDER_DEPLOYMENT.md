# Deploying TherapyAI Backend to Render

This guide walks you through deploying the FastAPI backend to Render.com (free tier available).

## Prerequisites
- GitHub account (already set up)
- Render.com account (free)

## Step-by-Step Deployment

### 1. Create a Render Account
1. Go to https://render.com
2. Click **Sign up with GitHub**
3. Authorize Render to access your GitHub account

### 2. Create a New Web Service
1. From your Render dashboard, click **New → Web Service**
2. Select your GitHub repository: `AI-Powered_Physical_Therapy-main`
3. Click **Connect**

### 3. Configure the Service
Fill in the following:

| Field | Value |
|-------|-------|
| **Name** | `therapy-ai-backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install --no-cache-dir -r backend/requirements.txt` |
| **Start Command** | `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000` |
| **Plan** | Free (recommended for testing) |

### 4. Add Environment Variables
Click **Environment** and add these variables:

```
PYTHON_VERSION=3.12
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://therapy-ai-mu.vercel.app
DATABASE_URL=sqlite:///./therapy.db
```

### 5. Deploy
Click **Create Web Service** and wait for the build to complete (~3-5 minutes).

Once deployed, Render will provide you with a URL like:
```
https://therapy-ai-backend-xxxxx.onrender.com
```

## 6. Update Frontend API URL

After your backend is deployed, update the frontend code:

**File:** `sites/ai-therapy/src/services/api.ts`

Change line 1 from:
```typescript
const API_URL = 'http://localhost:8000';
```

To:
```typescript
const API_URL = 'https://therapy-ai-backend-xxxxx.onrender.com';
```

(Replace `xxxxx` with your Render app ID)

## 7. Redeploy Frontend to Vercel

1. Commit and push your changes:
```bash
git add sites/ai-therapy/src/services/api.ts
git commit -m "Update API URL to Render backend"
git push
```

2. Vercel will automatically redeploy your frontend

## Testing the Full Stack

1. Visit: https://therapy-ai-mu.vercel.app
2. Sign up or log in
3. Try starting an exercise session
4. Check the browser console (F12) for any errors

## Common Issues

### "CORS error" on the frontend
- Make sure your Vercel URL is in the `CORS_ORIGINS` in Render
- Render environment variables take a few minutes to apply after update
- Restart the service: Dashboard → therapy-ai-backend → Settings → Restart

### "Connection refused" error
- Verify the backend is running: Visit `https://your-backend-url/health`
- Check that the API_URL in frontend matches your Render URL

### Build fails on Render
- Check build logs in Render dashboard
- Make sure `backend/requirements.txt` doesn't have `sqlite3` listed
- Ensure Python 3.12 is specified

## Optional: Use Automatic Deployment

The `render.yaml` file in the repo root can automate this process:

1. Go to Render dashboard
2. Click **New → Web Service**
3. Select the repository
4. Instead of manual config, Render will use `render.yaml` automatically

## Monitoring Your Deployment

- View logs: Dashboard → Select service → Logs
- Check status: Dashboard → Select service → Status
- Monitor uptime: Available in service settings

## Next Steps

After successful deployment:
- Test all features (login, exercise sessions, doctor portal)
- Monitor error logs for any issues
- Set up automatic backups if using a persistent database
- Consider upgrading to paid tier for production use
