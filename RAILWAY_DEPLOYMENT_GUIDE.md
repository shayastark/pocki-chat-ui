# Railway Deployment Guide - Complete Migration from Replit

## 🎯 Overview

This guide will help you:
1. Deploy XMTP Proxy to Railway (new service)
2. Migrate Pocki Chat frontend from Replit to Railway
3. Connect everything with your existing Pocki Agent on Railway

**Time estimate:** 2-3 hours  
**Cost:** ~$10-15/month total (less than Replit!)

## 📊 Your Current Setup

```
✅ Railway: Pocki Agent (already deployed)
❌ Replit:  Pocki Chat frontend (moving to Railway)
🆕 Railway: XMTP Proxy (deploying today)
```

## 🎉 Bonus: Using pocki.base.eth

Your ENS basename makes this even better! Deep links will use:
```
https://base.app/pocki.base.eth
```

Instead of ugly hex addresses. Super clean and professional! 🚀

---

## Part 1: Deploy XMTP Proxy to Railway

### Step 1: Create XMTP Proxy Repository

```bash
# Create new directory for XMTP proxy
cd ~/projects  # or wherever you keep projects
mkdir pocki-xmtp-proxy
cd pocki-xmtp-proxy

# Initialize git
git init

# Initialize npm
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install @xmtp/node-sdk@^0.0.6 express@^4.19.2 cors@^2.8.5 ws@^8.16.0 viem@^2.38.2 dotenv@^16.4.5
```

### Step 3: Create Server Files

Create these files in your `pocki-xmtp-proxy` directory:

**`server.js`** (simplified starter for quick deployment):

```javascript
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.PORT || 3001;
const XMTP_ENV = process.env.XMTP_ENV || 'production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());
const MAX_CLIENTS = parseInt(process.env.MAX_CLIENTS || '100');

console.log('🚀 Starting XMTP Proxy Service...');
console.log(`   Environment: ${XMTP_ENV}`);
console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

// CORS
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Client cache (TODO: Move to Redis for production)
const clientCache = new Map();
const activeConnections = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'pocki-xmtp-proxy',
    version: '1.0.0',
    environment: XMTP_ENV,
    uptime: `${Math.floor(process.uptime() / 60)}m`,
    activeClients: clientCache.size,
    activeConnections: activeConnections.size,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Pocki XMTP Proxy',
    version: '1.0.0',
    agent: 'pocki.base.eth',
    status: 'running',
    docs: 'https://github.com/your-org/pocki-xmtp-proxy',
  });
});

// Initialize XMTP client
app.post('/api/xmtp/initialize', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    console.log(`📝 Initialize request from ${walletAddress}`);

    // Check cache
    if (clientCache.has(walletAddress)) {
      const existing = clientCache.get(walletAddress);
      existing.lastActive = Date.now();
      
      console.log(`✅ Using cached client for ${walletAddress}`);
      return res.json({
        success: true,
        inboxId: existing.inboxId,
        cached: true,
      });
    }

    // Check max clients
    if (clientCache.size >= MAX_CLIENTS) {
      // Evict oldest
      let oldestKey = null;
      let oldestTime = Infinity;
      
      for (const [key, value] of clientCache.entries()) {
        if (value.lastActive < oldestTime) {
          oldestTime = value.lastActive;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        clientCache.delete(oldestKey);
        console.log(`🧹 Evicted: ${oldestKey}`);
      }
    }

    // TODO: Implement real XMTP client creation
    // For now, use mock for testing
    const mockInboxId = `0x${walletAddress.slice(2, 10)}...mock`;
    
    clientCache.set(walletAddress, {
      inboxId: mockInboxId,
      lastActive: Date.now(),
    });

    console.log(`✅ Initialized for ${walletAddress}`);

    res.json({
      success: true,
      inboxId: mockInboxId,
      cached: false,
    });

  } catch (error) {
    console.error('❌ Initialize error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
    });
  }
});

// Send message
app.post('/api/xmtp/send', async (req, res) => {
  try {
    const { walletAddress, recipientInboxId, content } = req.body;

    if (!walletAddress || !recipientInboxId || !content) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    console.log(`📤 Send from ${walletAddress} to ${recipientInboxId}`);

    const cached = clientCache.get(walletAddress);
    if (!cached) {
      return res.status(401).json({ 
        success: false,
        error: 'Client not initialized' 
      });
    }

    cached.lastActive = Date.now();

    // TODO: Implement real message sending
    const mockMessageId = `msg_${Date.now()}`;

    console.log(`✅ Message sent (mock): ${mockMessageId}`);

    res.json({
      success: true,
      messageId: mockMessageId,
      conversationId: recipientInboxId,
    });

  } catch (error) {
    console.error('❌ Send error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
    });
  }
});

// Get messages
app.get('/api/xmtp/messages/:walletAddress/:conversationId', async (req, res) => {
  try {
    const { walletAddress, conversationId } = req.params;

    console.log(`📥 Get messages for ${walletAddress}`);

    const cached = clientCache.get(walletAddress);
    if (!cached) {
      return res.status(401).json({ 
        success: false,
        error: 'Client not initialized' 
      });
    }

    cached.lastActive = Date.now();

    // TODO: Implement real message fetching
    const mockMessages = [
      {
        id: 'msg_1',
        content: 'Hello from Pocki! 🎋',
        senderInboxId: conversationId,
        sentAt: new Date(Date.now() - 60000).toISOString(),
        contentType: 'text',
      },
    ];

    res.json({
      success: true,
      messages: mockMessages,
      count: mockMessages.length,
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
    });
  }
});

// WebSocket for real-time messages
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket connected');
  
  let walletAddress = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'AUTHENTICATE') {
        walletAddress = message.walletAddress;
        
        const cached = clientCache.get(walletAddress);
        if (!cached) {
          ws.send(JSON.stringify({ 
            type: 'ERROR', 
            error: 'Client not initialized' 
          }));
          return;
        }

        activeConnections.set(walletAddress, { ws });
        
        ws.send(JSON.stringify({ 
          type: 'AUTHENTICATED', 
          walletAddress 
        }));

        console.log(`✅ WebSocket authenticated: ${walletAddress}`);
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ 
        type: 'ERROR', 
        error: 'Invalid message' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
    if (walletAddress) {
      activeConnections.delete(walletAddress);
    }
  });
});

// Cleanup inactive clients
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const CLIENT_TIMEOUT = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [address, cached] of clientCache.entries()) {
    if (now - cached.lastActive > CLIENT_TIMEOUT) {
      clientCache.delete(address);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} client(s)`);
  }
}, CLEANUP_INTERVAL);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ XMTP Proxy running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('🛑 Shutting down...');
  wss.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

**`railway.toml`:**

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**`.gitignore`:**

```
node_modules/
.env
.DS_Store
*.log
.vscode/
.idea/
```

**`README.md`:**

```markdown
# Pocki XMTP Proxy

XMTP proxy service for Pocki Chat (pocki.base.eth)

## Deploy to Railway

\`\`\`bash
railway login
railway init
railway up
\`\`\`

## Environment Variables

Set these in Railway dashboard:
- `XMTP_ENV=production`
- `ALLOWED_ORIGINS=https://your-frontend.railway.app,https://base.app`
- `MAX_CLIENTS=100`
```

### Step 4: Commit and Push to Git

```bash
# Add all files
git add .

# Commit
git commit -m "Initial XMTP proxy setup"

# Create GitHub repo (or use Railway's Git)
# Push to GitHub (optional but recommended)
```

### Step 5: Deploy to Railway

```bash
# Login to Railway
railway login

# Initialize new Railway project
railway init
# Select: "Create new project"
# Name it: "pocki-xmtp-proxy"

# Link to service
railway link

# Deploy
railway up

# This will:
# - Build your service
# - Deploy it
# - Give you a URL
```

### Step 6: Configure Railway Dashboard

1. **Go to Railway Dashboard** (railway.app)
2. **Find your pocki-xmtp-proxy service**
3. **Add Environment Variables:**
   - Click "Variables" tab
   - Add:
     ```
     XMTP_ENV = production
     ALLOWED_ORIGINS = https://your-domain.com,https://base.app
     MAX_CLIENTS = 100
     ```

4. **Add Persistent Volume:**
   - Click "Volumes" tab
   - Click "Add Volume"
   - Mount path: `/data`
   - Size: 1GB (start small)
   - Save

5. **Get Your Service URL:**
   - Click "Settings" tab
   - Under "Domains", you'll see your Railway URL
   - Copy this URL (e.g., `pocki-xmtp-proxy.railway.app`)
   - You'll need this for the frontend!

### Step 7: Test the Proxy

```bash
# Get your Railway URL
railway domain

# Test health endpoint
curl https://your-proxy.railway.app/health

# Should return:
# {
#   "status": "ok",
#   "service": "pocki-xmtp-proxy",
#   ...
# }

# Test root endpoint
curl https://your-proxy.railway.app/

# Should return:
# {
#   "service": "Pocki XMTP Proxy",
#   "agent": "pocki.base.eth",
#   ...
# }
```

✅ **XMTP Proxy is now deployed!**

---

## Part 2: Migrate Frontend from Replit to Railway

### Step 1: Prepare Your Pocki Chat Repository

If your code is already on GitHub:
```bash
# Just note your repo URL
# https://github.com/your-username/pocki-chat
```

If your code is only on Replit:
```bash
# On Replit, use the Shell:
git remote add github https://github.com/your-username/pocki-chat.git
git push github main

# Or download from Replit and push manually
```

### Step 2: Create New Railway Service for Frontend

```bash
# In your pocki-chat directory
cd ~/projects/pocki-chat

# Login to Railway (if not already)
railway login

# Link to your existing Railway project
railway link
# Select the project where your Pocki Agent is

# Add new service
railway service
# Select "Create new service"
# Name it: "pocki-chat-frontend"

# Deploy
railway up
```

### Step 3: Set Environment Variables in Railway

In Railway Dashboard > pocki-chat-frontend > Variables, add:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID=<your-base-app-client-id>

# XMTP Configuration
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_AGENT_ADDRESS=<your-agent-inbox-id>
NEXT_PUBLIC_XMTP_PROXY_URL=https://your-xmtp-proxy.railway.app

# Base App
NEXT_PUBLIC_AGENT_BASENAME=pocki.base.eth

# Deployment
NODE_ENV=production
```

### Step 4: Update Frontend Code

Add the proxy URL to your constants:

**`lib/constants.ts`:**

```typescript
export const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '';
export const AGENT_BASENAME = 'pocki.base.eth'; // Your ENS basename
export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'production') as 'production' | 'dev' | 'local';
export const XMTP_PROXY_URL = process.env.NEXT_PUBLIC_XMTP_PROXY_URL || 'http://localhost:3001';
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
export const PRIVY_BASE_APP_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID || '';
```

### Step 5: Deploy and Test

```bash
# Deploy to Railway
git add .
git commit -m "Add Railway configuration"
git push

# Railway will auto-deploy

# Get your frontend URL
railway domain

# Test in browser
open https://your-frontend.railway.app
```

### Step 6: Update CORS in Proxy

Back in your XMTP proxy Railway dashboard:
1. Go to Variables
2. Update `ALLOWED_ORIGINS`:
   ```
   https://your-frontend.railway.app,https://base.app
   ```
3. Service will auto-restart

---

## Part 3: Update Replit to Railway CORS

### Update ALLOWED_ORIGINS in XMTP Proxy

Since you're migrating from Replit, temporarily allow both:

```env
ALLOWED_ORIGINS=https://your-replit-url.repl.co,https://your-frontend.railway.app,https://base.app
```

This way, you can test Railway while Replit is still running.

Once you confirm Railway works, remove the Replit URL.

---

## Part 4: Custom Domains (Optional)

### For Frontend

1. In Railway Dashboard > pocki-chat-frontend > Settings > Domains
2. Click "Add Custom Domain"
3. Enter: `chat.pockiagent.com` (or whatever you want)
4. Add the CNAME record to your DNS:
   ```
   CNAME chat.pockiagent.com -> your-frontend.railway.app
   ```

### For Proxy

1. In Railway Dashboard > pocki-xmtp-proxy > Settings > Domains
2. Click "Add Custom Domain"
3. Enter: `api.pockiagent.com`
4. Add the CNAME record to your DNS

---

## Part 5: Testing Checklist

### Test XMTP Proxy

- [ ] Health endpoint returns 200
  ```bash
  curl https://your-proxy.railway.app/health
  ```

- [ ] Initialize endpoint works (returns mock data for now)
  ```bash
  curl -X POST https://your-proxy.railway.app/api/xmtp/initialize \
    -H "Content-Type: application/json" \
    -d '{"walletAddress":"0x123...","signature":"0xabc...","message":"test"}'
  ```

- [ ] CORS headers allow your frontend

### Test Frontend

- [ ] Opens in browser ✅
- [ ] Privy login works ✅
- [ ] Chat interface loads ✅
- [ ] Direct XMTP works (browsers/Farcaster) ✅
- [ ] Base App shows fallback with pocki.base.eth link ✅

### Test Base App Deep Link

- [ ] Open Base App
- [ ] Search "pocki.base.eth" ✅
- [ ] Pocki profile appears ✅
- [ ] Can send DM ✅
- [ ] Pocki responds ✅

---

## Part 6: Sunset Replit

### Once Everything Works on Railway:

1. **Update any links/bookmarks** to use Railway URL
2. **Redirect Replit to Railway:**
   - In Replit, create a simple redirect page
   - Or just shut down the Replit app

3. **Cancel Replit Subscription:**
   - You're now fully on Railway!
   - Save $20-50/month 💰

---

## 📊 Final Architecture

```
┌──────────────────────────────────────────────┐
│             Railway Platform                 │
│                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────┐│
│  │   Pocki    │  │   XMTP     │  │ Pocki  ││
│  │   Agent    │  │   Proxy    │  │  Chat  ││
│  │            │  │            │  │Frontend││
│  │ (Existing) │  │   (NEW!)   │  │ (NEW!) ││
│  └────────────┘  └────────────┘  └────────┘│
│         │               │             │     │
│         └───────────────┼─────────────┘     │
│                         │                   │
└─────────────────────────┼───────────────────┘
                          │
                          ↓
                   XMTP Network
```

---

## 💰 Cost Breakdown

### Railway Services

| Service | Monthly Cost |
|---------|-------------|
| Pocki Agent | (current) |
| XMTP Proxy | $5-10 |
| Frontend | $5 |
| **Total** | **+$10-15** |

### vs. Replit Autoscale
- Replit: $20-50+/month
- Railway: $10-15/month
- **Savings: $10-35/month!** 💰

---

## 🎯 Timeline

### Today (2-3 hours)
- [x] Read this guide
- [ ] Deploy XMTP proxy to Railway (30-45 min)
- [ ] Test proxy health endpoint (5 min)
- [ ] Deploy frontend to Railway (30-45 min)
- [ ] Test in browser (15 min)
- [ ] Test Base App deep link (15 min)

### This Week
- [ ] Monitor Railway performance
- [ ] Fix any issues
- [ ] Update DNS if using custom domains
- [ ] Fully test all platforms

### Next Week
- [ ] Sunset Replit
- [ ] Celebrate! 🎉

---

## 🆘 Troubleshooting

### Proxy Won't Start
```bash
# Check logs
railway logs

# Common issues:
# - Missing environment variables
# - Port already in use (Railway auto-assigns)
# - Package.json errors
```

### Frontend Can't Connect to Proxy
```bash
# Check CORS:
# - ALLOWED_ORIGINS in proxy includes frontend URL
# - Frontend uses correct XMTP_PROXY_URL
# - Both services are deployed and running
```

### Base App Deep Link Doesn't Work
```bash
# Try these URL formats:
# https://base.app/pocki.base.eth
# https://base.app/@pocki.base.eth
# https://base.app/dm/pocki.base.eth

# Make sure pocki.base.eth resolves in Base App search
```

---

## 🎉 Success Criteria

You're done when:
- ✅ XMTP proxy health check returns 200
- ✅ Frontend loads on Railway URL
- ✅ Browser/Farcaster users see embedded chat
- ✅ Base App users see pocki.base.eth deep link
- ✅ All platforms working
- ✅ Replit shut down
- ✅ Saving money! 💰

---

## 📞 Next Steps

Ready to deploy? Let's do this!

1. Start with Part 1 (XMTP Proxy)
2. Then Part 2 (Frontend Migration)
3. Test everything
4. Sunset Replit

Want me to help you through any specific step? Just let me know! 🚀
