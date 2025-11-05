# Railway XMTP Proxy - Full Implementation Guide

## 🎯 Strategy: Hybrid Approach (Best of Both Worlds)

You're right to want **both** options! Here's why this is the best approach:

### Why Hybrid?

1. **Custom UI in Mini App** - Your branded experience, full control
2. **Deep Link Fallback** - If proxy has issues, users can still chat
3. **Consistent with Bankr** - Other agents use this pattern successfully
4. **Better Analytics** - Track usage in your own UI
5. **Rich Features** - Custom transaction flows, formatting, etc.

### User Flow

```
User opens Pocki Chat Mini App in Base App
         ↓
    Try XMTP Proxy First
         ↓
   ┌─────┴─────┐
   │           │
 Success      Fail
   │           │
   ↓           ↓
Custom UI   Deep Link
in Mini App  to Native DM
```

## 📋 Railway Setup (3 Services Strategy)

Since you're moving from Replit anyway, let's set up Railway properly:

### Service 1: XMTP Proxy Service (NEW)
**Purpose:** Enable custom chat UI in Base App Mini App
- Handles XMTP client initialization
- Provides REST API for messaging
- WebSocket/SSE for real-time messages
- Persistent volume for XMTP database

### Service 2: Pocki Agent (EXISTING)
**Purpose:** Your AI agent logic
- Already on Railway
- Keep as separate service
- Communicates via XMTP network

### Service 3: Pocki Chat Frontend (NEW on Railway)
**Purpose:** Next.js frontend
- Currently on Replit
- Move to Railway for better performance
- Closer to XMTP proxy (lower latency)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Railway Platform                     │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐ │
│  │   Pocki      │   │    XMTP      │   │   Pocki    │ │
│  │   Agent      │   │    Proxy     │   │   Chat     │ │
│  │   Service    │   │   Service    │   │  Frontend  │ │
│  │              │   │              │   │            │ │
│  │ (Existing)   │   │   (NEW!)     │   │   (NEW!)   │ │
│  │              │   │              │   │            │ │
│  │ - AI Logic   │   │ - Client     │   │ - Next.js  │ │
│  │ - Trading    │   │   Manager    │   │ - React UI │ │
│  │ - Analysis   │   │ - REST API   │   │ - Chat UI  │ │
│  │              │   │ - WebSocket  │   │            │ │
│  │ Volume:      │   │              │   │            │ │
│  │ Agent Data   │   │ Volume:      │   │            │ │
│  └──────────────┘   │ XMTP DB      │   └────────────┘ │
│         │            └──────────────┘         │        │
│         │                   │                 │        │
│         └───────────────────┼─────────────────┘        │
│                             │                          │
└─────────────────────────────┼──────────────────────────┘
                              │
                              ↓
                      XMTP Network
                     (production.xmtp.network)
```

## 🚀 Step 1: Create XMTP Proxy Service

### 1.1 Create New Railway Project

```bash
# In a new directory
mkdir pocki-xmtp-proxy
cd pocki-xmtp-proxy
npm init -y
```

### 1.2 Install Dependencies

```json
{
  "name": "pocki-xmtp-proxy",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "@xmtp/node-sdk": "^1.0.0",
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "ws": "^8.16.0",
    "viem": "^2.38.2",
    "dotenv": "^16.4.5"
  }
}
```

### 1.3 Create Server (`server.js`)

```javascript
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Client } from '@xmtp/node-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.PORT || 3001;
const XMTP_ENV = process.env.XMTP_ENV || 'production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';
const MAX_CLIENTS = 100; // Prevent DOS

// CORS configuration
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// In-memory client cache (production: use Redis)
const clientCache = new Map();
const activeConnections = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeClients: clientCache.size,
    activeConnections: activeConnections.size,
    env: XMTP_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Initialize XMTP client for a user
app.post('/api/xmtp/initialize', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, signature, message' 
      });
    }

    // Verify signature to prevent impersonation
    const isValid = await verifySignature(walletAddress, message, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if client already exists
    if (clientCache.has(walletAddress)) {
      const existingClient = clientCache.get(walletAddress);
      return res.json({
        success: true,
        inboxId: existingClient.inboxId,
        cached: true,
      });
    }

    // Check max clients limit
    if (clientCache.size >= MAX_CLIENTS) {
      // Clean up oldest inactive client
      const oldestKey = clientCache.keys().next().value;
      clientCache.delete(oldestKey);
      console.log(`Evicted oldest client: ${oldestKey}`);
    }

    // Create XMTP signer from signature
    // Note: This is simplified - in production, use proper key derivation
    const signer = createSignerFromSignature(walletAddress, signature);
    
    // Initialize XMTP client
    const client = await Client.create(signer, {
      env: XMTP_ENV,
    });

    // Cache the client
    clientCache.set(walletAddress, {
      client,
      inboxId: client.inboxId,
      lastActive: Date.now(),
    });

    console.log(`✅ Initialized XMTP client for ${walletAddress}`);
    console.log(`   Inbox ID: ${client.inboxId}`);

    res.json({
      success: true,
      inboxId: client.inboxId,
      cached: false,
    });

  } catch (error) {
    console.error('❌ XMTP initialization error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize XMTP client',
      message: error.message,
    });
  }
});

// Send message endpoint
app.post('/api/xmtp/send', async (req, res) => {
  try {
    const { walletAddress, recipientInboxId, content, contentType = 'text' } = req.body;

    if (!walletAddress || !recipientInboxId || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, recipientInboxId, content' 
      });
    }

    const cached = clientCache.get(walletAddress);
    if (!cached) {
      return res.status(401).json({ 
        error: 'Client not initialized. Call /api/xmtp/initialize first.' 
      });
    }

    const { client } = cached;
    cached.lastActive = Date.now();

    // Sync conversations to ensure we have the latest
    await client.conversations.syncAll(['allowed', 'unknown', 'denied']);

    // Get or create conversation
    let conversation = await client.conversations.getDmByInboxId(recipientInboxId);
    
    if (!conversation) {
      console.log(`Creating new conversation with ${recipientInboxId}`);
      conversation = await client.conversations.newDm(recipientInboxId);
      
      // Set consent to allowed
      await conversation.updateConsentState('allowed');
      
      // Sync again after creating
      await client.conversations.syncAll(['allowed', 'unknown', 'denied']);
    }

    // Send message
    const messageId = await conversation.send(content);

    console.log(`✅ Message sent from ${walletAddress} to ${recipientInboxId}`);

    res.json({
      success: true,
      messageId,
      conversationId: conversation.id,
    });

  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error.message,
    });
  }
});

// Get messages endpoint
app.get('/api/xmtp/messages/:walletAddress/:conversationId', async (req, res) => {
  try {
    const { walletAddress, conversationId } = req.params;

    const cached = clientCache.get(walletAddress);
    if (!cached) {
      return res.status(401).json({ 
        error: 'Client not initialized' 
      });
    }

    const { client } = cached;
    cached.lastActive = Date.now();

    // Sync conversations
    await client.conversations.syncAll(['allowed', 'unknown', 'denied']);

    // Get conversation
    const conversation = await client.conversations.getDmByInboxId(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messages = await conversation.messages();

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderInboxId: msg.senderInboxId,
      sentAt: msg.sentAt,
      contentType: msg.contentType?.typeId || 'text',
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length,
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ 
      error: 'Failed to get messages',
      message: error.message,
    });
  }
});

// WebSocket for real-time message streaming
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected');
  
  let walletAddress = null;
  let streamActive = false;
  let messageStream = null;

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

        // Start streaming messages
        const { client } = cached;
        streamActive = true;

        try {
          messageStream = await client.conversations.streamAllMessages({
            onValue: (msg) => {
              if (streamActive) {
                ws.send(JSON.stringify({
                  type: 'MESSAGE',
                  message: {
                    id: msg.id,
                    content: msg.content,
                    senderInboxId: msg.senderInboxId,
                    sentAt: msg.sentAt,
                    contentType: msg.contentType?.typeId || 'text',
                  },
                }));
              }
            },
            onError: (error) => {
              console.error('Stream error:', error);
              ws.send(JSON.stringify({ 
                type: 'ERROR', 
                error: 'Stream error occurred' 
              }));
            },
          });

          activeConnections.set(walletAddress, { ws, messageStream });
          
          ws.send(JSON.stringify({ 
            type: 'AUTHENTICATED', 
            walletAddress 
          }));

          console.log(`✅ Started message stream for ${walletAddress}`);
        } catch (streamError) {
          console.error('Failed to start stream:', streamError);
          ws.send(JSON.stringify({ 
            type: 'ERROR', 
            error: 'Failed to start message stream' 
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'ERROR', 
        error: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    streamActive = false;
    
    if (walletAddress) {
      activeConnections.delete(walletAddress);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Utility: Verify signature (simplified)
async function verifySignature(walletAddress, message, signature) {
  // TODO: Implement proper signature verification using viem
  // For now, always return true (INSECURE - FIX IN PRODUCTION!)
  console.warn('⚠️ Signature verification not implemented - accepting all signatures');
  return true;
}

// Utility: Create signer from signature (simplified)
function createSignerFromSignature(walletAddress, signature) {
  // TODO: Implement proper signer creation
  // This is a simplified version - in production, use proper key derivation
  
  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifier: walletAddress.toLowerCase(),
      identifierKind: 'Ethereum',
    }),
    signMessage: async (message) => {
      // This would use the derived key in production
      throw new Error('Signer not fully implemented yet');
    },
  };
}

// Cleanup inactive clients periodically
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 30 * 60 * 1000; // 30 minutes

  for (const [address, cached] of clientCache.entries()) {
    if (now - cached.lastActive > TIMEOUT) {
      clientCache.delete(address);
      console.log(`🧹 Cleaned up inactive client: ${address}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Start server
server.listen(PORT, () => {
  console.log(`🚀 XMTP Proxy Service running on port ${PORT}`);
  console.log(`   Environment: ${XMTP_ENV}`);
  console.log(`   Max clients: ${MAX_CLIENTS}`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket server
  wss.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
```

### 1.4 Create Railway Configuration

**`railway.toml`:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 1.5 Environment Variables (Set in Railway Dashboard)

```env
# XMTP Configuration
XMTP_ENV=production

# Security
SESSION_SECRET=<generate-random-string>
ALLOWED_ORIGINS=https://your-pocki-chat.railway.app,https://base.app

# Server
PORT=3001

# Optional: Database connection for production
# REDIS_URL=<redis-connection-string>
```

### 1.6 Add Persistent Volume in Railway

1. Go to Railway dashboard
2. Select XMTP Proxy service
3. Go to "Volumes" tab
4. Click "Add Volume"
5. Mount path: `/data`
6. Size: Start with 1GB (expand as needed)

This ensures XMTP database persists across deployments.

## 🚀 Step 2: Update Frontend to Use Proxy

### 2.1 Create Proxy Hook (`hooks/useXMTPProxy.tsx`)

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { AGENT_ADDRESS } from '@/lib/constants';

const XMTP_PROXY_URL = process.env.NEXT_PUBLIC_XMTP_PROXY_URL || 'http://localhost:3001';

interface Message {
  id: string;
  content: string;
  senderInboxId: string;
  sentAt: Date;
  contentType?: string;
}

export function useXMTPProxy() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const activeWallet = wallets[0];

  // Initialize XMTP through proxy
  const initializeClient = useCallback(async () => {
    if (!authenticated || !activeWallet || isInitialized) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Sign authentication message
      const message = `Authenticate XMTP Proxy for ${activeWallet.address}\nTimestamp: ${Date.now()}`;
      const provider = await activeWallet.getEthereumProvider();
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, activeWallet.address],
      });

      console.log('🔐 Signed authentication message');

      // Initialize XMTP through proxy
      const response = await fetch(`${XMTP_PROXY_URL}/api/xmtp/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeWallet.address,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy initialization failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ XMTP initialized via proxy:', data);

      // Connect WebSocket for real-time messages
      connectWebSocket(activeWallet.address);

      setIsInitialized(true);
      
      // Load existing messages
      await loadMessages();
    } catch (err) {
      console.error('❌ Proxy initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize proxy');
    } finally {
      setIsInitializing(false);
    }
  }, [authenticated, activeWallet, isInitialized]);

  // Connect WebSocket for real-time messages
  const connectWebSocket = (walletAddress: string) => {
    const wsUrl = XMTP_PROXY_URL.replace('http', 'ws');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      ws.send(JSON.stringify({
        type: 'AUTHENTICATE',
        walletAddress,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'MESSAGE') {
          const msg = data.message;
          
          // Add message to state
          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id);
            if (exists) return prev;
            
            return [...prev, {
              id: msg.id,
              content: msg.content,
              senderInboxId: msg.senderInboxId,
              sentAt: new Date(msg.sentAt),
              contentType: msg.contentType,
            }];
          });

          // Turn off typing indicator when agent responds
          if (msg.senderInboxId === AGENT_ADDRESS) {
            setIsAgentTyping(false);
          }

          console.log('📨 New message via WebSocket:', msg);
        } else if (data.type === 'ERROR') {
          console.error('❌ WebSocket error:', data.error);
        } else if (data.type === 'AUTHENTICATED') {
          console.log('✅ WebSocket authenticated');
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      // Reconnect after delay
      setTimeout(() => {
        if (isInitialized) {
          connectWebSocket(walletAddress);
        }
      }, 5000);
    };

    wsRef.current = ws;
  };

  // Load messages from proxy
  const loadMessages = useCallback(async () => {
    if (!activeWallet || !isInitialized) return;

    try {
      const response = await fetch(
        `${XMTP_PROXY_URL}/api/xmtp/messages/${activeWallet.address}/${AGENT_ADDRESS}`
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      
      setMessages(data.messages.map((msg: any) => ({
        ...msg,
        sentAt: new Date(msg.sentAt),
      })));

      console.log(`✅ Loaded ${data.messages.length} messages from proxy`);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [activeWallet, isInitialized]);

  // Send message through proxy
  const sendMessage = useCallback(async (content: string) => {
    if (!activeWallet || !isInitialized) {
      throw new Error('Not initialized');
    }

    try {
      setIsAgentTyping(true);

      const response = await fetch(`${XMTP_PROXY_URL}/api/xmtp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeWallet.address,
          recipientInboxId: AGENT_ADDRESS,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('✅ Message sent via proxy:', data);

      // Optimistically add message to UI
      const optimisticMsg: Message = {
        id: data.messageId,
        content,
        senderInboxId: activeWallet.address,
        sentAt: new Date(),
      };

      setMessages(prev => [...prev, optimisticMsg]);
    } catch (err) {
      setIsAgentTyping(false);
      throw err;
    }
  }, [activeWallet, isInitialized]);

  // Initialize on mount
  useEffect(() => {
    if (authenticated && activeWallet && !isInitialized && !isInitializing) {
      initializeClient();
    }
  }, [authenticated, activeWallet, isInitialized, isInitializing, initializeClient]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isInitialized,
    isInitializing,
    error,
    messages,
    sendMessage,
    refreshMessages: loadMessages,
    isAgentTyping,
    activeWalletAddress: activeWallet?.address || null,
  };
}
```

### 2.2 Update Chat Page with Hybrid Approach

```typescript
// app/chat/page.tsx
import { useMiniApp } from '@/app/contexts/MiniAppContext';
import { useXMTP } from '@/hooks/useXMTP'; // Direct XMTP
import { useXMTPProxy } from '@/hooks/useXMTPProxy'; // Proxy XMTP
import { BaseAppChat } from '@/components/BaseAppChat'; // Deep link fallback

function ChatContent() {
  const { isBaseApp } = useMiniApp();
  
  // Try proxy first for Base App, direct for others
  const directXMTP = useXMTP();
  const proxyXMTP = useXMTPProxy();
  
  // Decide which to use
  const xmtp = isBaseApp ? proxyXMTP : directXMTP;
  
  // If proxy fails in Base App, show deep link fallback
  if (isBaseApp && proxyXMTP.error) {
    return <BaseAppChat />; // Deep link to native DM
  }
  
  // Regular chat UI using either proxy or direct XMTP
  return <RegularChatUI xmtp={xmtp} />;
}
```

## 📱 Base App Deep Link Integration

### Using Base Deeplinks as Fallback

From the [Base App deeplink docs](https://docs.base.org/base-app/agents/deeplinks):

```typescript
// components/BaseAppDeepLink.tsx
export function openBaseAppDM(agentInboxId: string, prefilledMessage?: string) {
  // Base App deep link format
  let deepLink = `https://base.app/dm/${agentInboxId}`;
  
  if (prefilledMessage) {
    deepLink += `?message=${encodeURIComponent(prefilledMessage)}`;
  }
  
  // Open in same window (stays in Base App context)
  window.open(deepLink, '_self');
}

// Usage in fallback component
<button onClick={() => openBaseAppDM(AGENT_ADDRESS, 'Hello Pocki!')}>
  Chat in Base App
</button>
```

## 🔄 Migration from Replit to Railway

### Frontend Migration Plan

```bash
# 1. Create new Railway project for frontend
railway init

# 2. Connect your Git repository
railway link

# 3. Set environment variables in Railway
railway variables set NEXT_PUBLIC_XMTP_PROXY_URL=https://your-xmtp-proxy.railway.app
railway variables set NEXT_PUBLIC_AGENT_ADDRESS=<agent-inbox-id>
# ... other env vars

# 4. Deploy
railway up

# 5. Get your Railway URL
railway domain
```

### Environment Variables to Set

```env
# Frontend (Pocki Chat)
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID=<base-app-client-id>
NEXT_PUBLIC_AGENT_ADDRESS=<pocki-agent-inbox-id>
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_XMTP_PROXY_URL=https://your-xmtp-proxy.railway.app

# Proxy (XMTP Proxy Service)
XMTP_ENV=production
SESSION_SECRET=<random-string>
ALLOWED_ORIGINS=https://your-pocki-chat.railway.app,https://base.app
PORT=3001
```

## 💰 Railway Pricing Estimate

### Monthly Costs

| Service | Resources | Estimated Cost |
|---------|-----------|----------------|
| Pocki Agent | Existing | Current cost |
| XMTP Proxy | 1GB RAM, 1GB Volume | $5-10/month |
| Frontend | 512MB RAM | $5/month |
| **Total Additional** | | **~$10-15/month** |

**Hobby Plan:** $5/month + usage  
**Pro Plan:** $20/month (recommended for production)

## 🎯 Recommended Implementation Order

### Phase 1: Set Up XMTP Proxy (2-3 days)
1. Create XMTP proxy service on Railway
2. Add persistent volume
3. Test with Postman/curl
4. Verify message sending/receiving

### Phase 2: Frontend Integration (1-2 days)
5. Create `useXMTPProxy` hook
6. Add conditional logic for Base App
7. Keep direct XMTP for browsers
8. Test locally

### Phase 3: Deep Link Fallback (1 day)
9. Implement Base App deep link component
10. Add fallback logic if proxy fails
11. Test both paths

### Phase 4: Migration (1 day)
12. Deploy frontend to Railway
13. Update DNS/domains
14. Monitor performance
15. Sunset Replit

### Phase 5: Optimization (ongoing)
16. Add Redis for client caching
17. Implement proper signature verification
18. Add analytics and monitoring
19. Performance tuning

## 📊 Comparison Matrix

| Feature | Direct XMTP (Browser) | Proxy XMTP (Base App) | Deep Link (Fallback) |
|---------|---------------------|---------------------|---------------------|
| Custom UI | ✅ Full control | ✅ Full control | ❌ Native Base UI |
| OPFS Works | ✅ Yes | N/A (server) | N/A (native) |
| Infrastructure | None | Railway server | None |
| Latency | Low | Medium | Low (native) |
| Cost | $0 | ~$10/month | $0 |
| Maintenance | None | Medium | None |
| Analytics | ✅ Full access | ✅ Full access | ❌ Limited |
| Branding | ✅ Your UI | ✅ Your UI | ❌ Base App UI |
| Reliability | High | High | Highest (native) |

## 🎯 My Recommendation: Hybrid Approach

```
Priority 1: XMTP Proxy (Your Branded Experience)
  ↓ (if fails)
Priority 2: Deep Link Fallback (Native Base App DM)
```

This gives you:
- ✅ Your custom UI in Mini App (like Bankr)
- ✅ Graceful fallback if proxy has issues
- ✅ Best user experience across all scenarios
- ✅ Full analytics in your UI
- ✅ Professional appearance

---

**Next Steps:** 
1. Review this implementation
2. Decide on timeline
3. I can help you set up each phase
4. Let's get you off Replit and onto Railway!

Want me to help you with any specific part first?
