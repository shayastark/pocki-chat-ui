# Quick Deploy Checklist - Railway Migration

## 🎯 Goal: Move from Replit to Railway + Deploy XMTP Proxy

**Time:** 2-3 hours  
**Cost:** ~$10-15/month (less than Replit!)  
**Risk:** Low (can test before switching)

---

## ✅ Pre-Flight Checklist

Before you start, make sure you have:

- [ ] Railway account (railway.app)
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Git installed
- [ ] Your Pocki Chat code (from Replit or GitHub)
- [ ] Your environment variables documented
- [ ] 2-3 hours of uninterrupted time

---

## 🚀 Phase 1: Deploy XMTP Proxy (45 minutes)

### 1. Create Proxy Project (10 min)

```bash
# Create directory
mkdir pocki-xmtp-proxy
cd pocki-xmtp-proxy

# Initialize
git init
npm init -y

# Install dependencies
npm install @xmtp/node-sdk@^0.0.6 express@^4.19.2 cors@^2.8.5 ws@^8.16.0 viem@^2.38.2 dotenv@^16.4.5
```

- [ ] Directory created
- [ ] Dependencies installed

### 2. Copy Server Files (15 min)

Copy these files from `RAILWAY_DEPLOYMENT_GUIDE.md`:
- [ ] `server.js` (the main proxy code)
- [ ] `railway.toml` (Railway configuration)
- [ ] `.gitignore`
- [ ] `README.md`

```bash
# Add package.json scripts
# Edit package.json and add:
"scripts": {
  "start": "node server.js"
}
```

- [ ] All files created
- [ ] package.json updated

### 3. Deploy to Railway (10 min)

```bash
# Commit everything
git add .
git commit -m "Initial XMTP proxy setup"

# Deploy to Railway
railway login
railway init  # Create new project: "pocki-xmtp-proxy"
railway link
railway up
```

- [ ] Code committed
- [ ] Deployed to Railway
- [ ] Deployment successful

### 4. Configure Railway (10 min)

In Railway Dashboard (railway.app):

**Environment Variables:**
- [ ] `XMTP_ENV` = `production`
- [ ] `ALLOWED_ORIGINS` = `*` (we'll restrict this later)
- [ ] `MAX_CLIENTS` = `100`

**Add Volume:**
- [ ] Click "Volumes" tab
- [ ] Click "Add Volume"
- [ ] Mount path: `/data`
- [ ] Size: `1GB`

**Get Service URL:**
- [ ] Go to Settings → Domains
- [ ] Copy your Railway URL (e.g., `pocki-xmtp-proxy.railway.app`)
- [ ] Save this URL - you'll need it!

### 5. Test Proxy (5 min)

```bash
# Test health endpoint
curl https://your-proxy.railway.app/health

# Should see:
# {"status":"ok", "service":"pocki-xmtp-proxy", ...}
```

- [ ] Health check returns 200
- [ ] Proxy is running

✅ **Phase 1 Complete!** XMTP Proxy is deployed!

---

## 🚀 Phase 2: Deploy Frontend to Railway (45 minutes)

### 1. Prepare Your Code (10 min)

If code is on GitHub:
```bash
cd ~/projects
git clone https://github.com/your-username/pocki-chat
cd pocki-chat
```

If code is only on Replit:
```bash
# Option 1: Download from Replit
# - Download as ZIP
# - Extract locally
# - Initialize git: git init

# Option 2: Push from Replit to GitHub
# In Replit Shell:
git remote add github https://github.com/your-username/pocki-chat.git
git push github main

# Then clone locally
```

- [ ] Code is in local directory
- [ ] Git is initialized

### 2. Update Code (15 min)

**Update `lib/constants.ts`:**

```typescript
export const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '';
export const AGENT_BASENAME = 'pocki.base.eth';
export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'production') as 'production' | 'dev' | 'local';
export const XMTP_PROXY_URL = process.env.NEXT_PUBLIC_XMTP_PROXY_URL || 'http://localhost:3001';
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
export const PRIVY_BASE_APP_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID || '';
```

**Commit changes:**
```bash
git add .
git commit -m "Add Railway configuration"
```

- [ ] constants.ts updated
- [ ] Changes committed

### 3. Deploy to Railway (10 min)

```bash
# Login and deploy
railway login
railway link  # Link to your existing Railway project with Pocki Agent
railway service  # Create new service: "pocki-chat-frontend"
railway up
```

- [ ] Frontend deployed to Railway

### 4. Set Environment Variables (10 min)

In Railway Dashboard → pocki-chat-frontend → Variables:

```env
NEXT_PUBLIC_PRIVY_APP_ID=<from-replit>
NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID=<from-replit>
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_AGENT_ADDRESS=<from-replit>
NEXT_PUBLIC_XMTP_PROXY_URL=https://your-proxy.railway.app
NEXT_PUBLIC_AGENT_BASENAME=pocki.base.eth
NODE_ENV=production
```

- [ ] All environment variables set
- [ ] Service redeployed automatically

### 5. Update Proxy CORS (5 min)

In Railway Dashboard → pocki-xmtp-proxy → Variables:

Update `ALLOWED_ORIGINS`:
```
https://your-frontend.railway.app,https://base.app
```

- [ ] CORS updated
- [ ] Proxy restarted

### 6. Test Frontend (5 min)

```bash
# Get your frontend URL
railway domain

# Open in browser
open https://your-frontend.railway.app
```

Test:
- [ ] Page loads
- [ ] Can login with Privy
- [ ] Chat interface works
- [ ] No console errors

✅ **Phase 2 Complete!** Frontend is on Railway!

---

## 🚀 Phase 3: Test Everything (30 minutes)

### Test in Browser (Desktop)
- [ ] Open: https://your-frontend.railway.app
- [ ] Login with wallet
- [ ] XMTP initializes successfully
- [ ] Can send/receive messages
- [ ] Everything works as before

### Test in Farcaster Mini App
- [ ] Open in Farcaster app
- [ ] Login works
- [ ] XMTP initializes
- [ ] Can chat with Pocki
- [ ] Works as before

### Test in Base App
- [ ] Open Mini App in Base App
- [ ] Login with Privy works
- [ ] See "Open Pocki Chat in Base App" button
- [ ] Click button → Opens `pocki.base.eth`
- [ ] Can search "pocki.base.eth" in Base App
- [ ] Pocki profile appears
- [ ] Can send DM to Pocki
- [ ] Pocki responds

### Test Deep Link Directly
- [ ] Open Base App
- [ ] Search for "pocki.base.eth"
- [ ] Profile shows up
- [ ] Can message directly
- [ ] Agent responds

✅ **Phase 3 Complete!** Everything tested!

---

## 🚀 Phase 4: Cleanup & Optimize (30 minutes)

### Update DNS (if you have custom domain)
- [ ] Point `chat.yourdomain.com` to Railway frontend
- [ ] Point `api.yourdomain.com` to Railway proxy
- [ ] Wait for DNS propagation (5-30 min)

### Restrict Proxy CORS
Update `ALLOWED_ORIGINS` to only allow your domains:
```
https://chat.yourdomain.com,https://base.app
```
Or keep Railway URL:
```
https://your-frontend.railway.app,https://base.app
```

- [ ] CORS restricted to production domains

### Monitor Performance
In Railway Dashboard:
- [ ] Check CPU usage (both services)
- [ ] Check memory usage
- [ ] Check logs for errors
- [ ] Everything looks good

### Sunset Replit
- [ ] Verify Railway works 100%
- [ ] Update any bookmarks/links
- [ ] Pause/delete Replit deployment
- [ ] Cancel Replit subscription
- [ ] Save money! 💰

✅ **Phase 4 Complete!** Migration done!

---

## 📊 Final Checklist

### Infrastructure
- [ ] XMTP Proxy running on Railway
- [ ] Frontend running on Railway
- [ ] Pocki Agent still running (unchanged)
- [ ] All services healthy
- [ ] Persistent volume attached to proxy

### Functionality
- [ ] Browser users: Embedded chat works ✅
- [ ] Farcaster users: Embedded chat works ✅
- [ ] Base App users: Deep link to pocki.base.eth ✅
- [ ] All platforms tested ✅
- [ ] No errors in console ✅

### Configuration
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] DNS updated (if using custom domain)
- [ ] Replit shut down
- [ ] Saving $10-35/month! 💰

---

## 🎉 Success!

You've successfully:
- ✅ Deployed XMTP Proxy to Railway
- ✅ Migrated frontend from Replit to Railway
- ✅ Integrated pocki.base.eth deep link
- ✅ Tested across all platforms
- ✅ Reduced monthly costs
- ✅ Improved performance

**Your Pocki Chat is now fully on Railway with hybrid XMTP support!** 🚀

---

## 📞 Need Help?

If you get stuck on any step:

1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Check environment variables:**
   - Make sure all required vars are set
   - No typos in URLs

3. **Test endpoints:**
   ```bash
   curl https://your-proxy.railway.app/health
   ```

4. **Common issues:**
   - CORS errors → Check ALLOWED_ORIGINS
   - 503 errors → Service may be starting (wait 30s)
   - Build errors → Check package.json scripts
   - Connection refused → Check XMTP_PROXY_URL

Want help with a specific step? Let me know! 🎋
