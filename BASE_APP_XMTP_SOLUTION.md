# Base App XMTP Integration Solution

## Problem

XMTP Browser SDK v5.0.1 requires OPFS (Origin Private File System) for local storage, which is blocked in Base App's iframe context due to browser security restrictions. This causes the following errors:

```
ERROR xmtp_mls::worker: Worker error: Metadata(Connection(Database(NotFound)))
Failed to initialize XMTP: Signature error Signature validation failed
```

## Current Status

✅ **Working in:**
- Web browsers (Chrome, Safari, Firefox, etc.)
- Farcaster Mini App
- Desktop applications

❌ **Not working in:**
- Base App (due to iframe OPFS restrictions)

## Solution: Server-Side XMTP Proxy on Railway

Since you're already using Railway for the Pocki agent deployment, the recommended solution is to deploy a server-side XMTP service that Base App users can connect through.

### Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Base App  │ ──API──>│  Railway XMTP    │ ──XMTP─>│  XMTP       │
│   (iframe)  │         │  Proxy Service   │         │  Network    │
└─────────────┘         └──────────────────┘         └─────────────┘
                                │
                                │ Persistent Volume
                                ▼
                        ┌──────────────────┐
                        │   XMTP Database  │
                        │   (SQLite/OPFS)  │
                        └──────────────────┘
```

### Implementation Steps

#### 1. Create XMTP Proxy Service

Create a new Railway service with Node.js that uses XMTP Node SDK:

```javascript
// server.js
import express from 'express';
import { Client } from '@xmtp/node-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Store XMTP clients per user wallet
const clientCache = new Map();

// Initialize XMTP client for a user
app.post('/api/xmtp/initialize', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    // Verify signature (important for security)
    // ... signature verification logic ...
    
    // Create or retrieve XMTP client
    if (!clientCache.has(walletAddress)) {
      const client = await Client.create(signer, {
        env: process.env.XMTP_ENV || 'production',
      });
      clientCache.set(walletAddress, client);
    }
    
    const client = clientCache.get(walletAddress);
    
    res.json({
      success: true,
      inboxId: client.inboxId,
    });
  } catch (error) {
    console.error('XMTP initialization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message endpoint
app.post('/api/xmtp/send', async (req, res) => {
  try {
    const { walletAddress, recipientInboxId, content } = req.body;
    
    const client = clientCache.get(walletAddress);
    if (!client) {
      return res.status(401).json({ error: 'Client not initialized' });
    }
    
    // Get or create conversation
    const conversation = await client.conversations.getDmByInboxId(recipientInboxId) ||
                        await client.conversations.newDm(recipientInboxId);
    
    // Send message
    const messageId = await conversation.send(content);
    
    res.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages endpoint
app.get('/api/xmtp/messages/:walletAddress/:conversationId', async (req, res) => {
  try {
    const { walletAddress, conversationId } = req.params;
    
    const client = clientCache.get(walletAddress);
    if (!client) {
      return res.status(401).json({ error: 'Client not initialized' });
    }
    
    // Sync and get messages
    await client.conversations.syncAll(['allowed', 'unknown', 'denied']);
    const conversation = await client.conversations.getDmByInboxId(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const messages = await conversation.messages();
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderInboxId: msg.senderInboxId,
        sentAt: msg.sentAt,
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stream messages endpoint (WebSocket or SSE)
app.get('/api/xmtp/stream/:walletAddress', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const { walletAddress } = req.params;
  const client = clientCache.get(walletAddress);
  
  if (!client) {
    res.write(`data: ${JSON.stringify({ error: 'Client not initialized' })}\n\n`);
    return res.end();
  }
  
  try {
    const stream = await client.conversations.streamAllMessages({
      onValue: (message) => {
        res.write(`data: ${JSON.stringify({
          id: message.id,
          content: message.content,
          senderInboxId: message.senderInboxId,
          sentAt: message.sentAt,
        })}\n\n`);
      },
      onError: (error) => {
        console.error('Stream error:', error);
      },
    });
    
    req.on('close', () => {
      // Clean up stream when client disconnects
      console.log('Client disconnected from stream');
    });
  } catch (error) {
    console.error('Stream setup error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`XMTP Proxy Service running on port ${PORT}`);
});
```

#### 2. Railway Configuration

**package.json:**
```json
{
  "name": "xmtp-proxy-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@xmtp/node-sdk": "^1.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "viem": "^2.38.2"
  }
}
```

**Railway Settings:**
- Add a **Persistent Volume** mounted at `/data` for XMTP database storage
- Set environment variables:
  - `XMTP_ENV=production`
  - `PORT=3001`
  - `ALLOWED_ORIGINS=https://your-pocki-chat-domain.com`

#### 3. Update Pocki Chat Frontend

Create a new hook for Base App that uses the proxy service:

```typescript
// hooks/useXMTPProxy.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const XMTP_PROXY_URL = process.env.NEXT_PUBLIC_XMTP_PROXY_URL || 'https://your-railway-xmtp-proxy.railway.app';

export function useXMTPProxy() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initializeClient = useCallback(async () => {
    if (!authenticated || wallets.length === 0) return;
    
    const wallet = wallets[0];
    
    try {
      // Sign authentication message
      const message = `Authenticate XMTP for ${wallet.address}`;
      const provider = await wallet.getEthereumProvider();
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, wallet.address],
      });
      
      // Initialize XMTP through proxy
      const response = await fetch(`${XMTP_PROXY_URL}/api/xmtp/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.address,
          signature,
          message,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize XMTP');
      }
      
      const data = await response.json();
      console.log('✅ XMTP initialized via proxy:', data);
      setIsInitialized(true);
    } catch (err) {
      console.error('❌ XMTP proxy initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  }, [authenticated, wallets]);
  
  const sendMessage = useCallback(async (recipientInboxId: string, content: string) => {
    if (!isInitialized || wallets.length === 0) {
      throw new Error('XMTP not initialized');
    }
    
    const wallet = wallets[0];
    
    const response = await fetch(`${XMTP_PROXY_URL}/api/xmtp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: wallet.address,
        recipientInboxId,
        content,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return await response.json();
  }, [isInitialized, wallets]);
  
  useEffect(() => {
    if (authenticated && wallets.length > 0 && !isInitialized) {
      initializeClient();
    }
  }, [authenticated, wallets, isInitialized, initializeClient]);
  
  return {
    isInitialized,
    error,
    sendMessage,
  };
}
```

#### 4. Conditional Hook Selection

Update your main component to use the proxy when in Base App:

```typescript
// In your chat component
import { useMiniApp } from '@/app/contexts/MiniAppContext';
import { useXMTP } from '@/hooks/useXMTP';
import { useXMTPProxy } from '@/hooks/useXMTPProxy';

export default function ChatComponent() {
  const { isBaseApp } = useMiniApp();
  
  // Use proxy for Base App, direct client for others
  const directXMTP = useXMTP();
  const proxyXMTP = useXMTPProxy();
  
  const xmtp = isBaseApp ? proxyXMTP : directXMTP;
  
  // Rest of your component...
}
```

## Security Considerations

### Authentication
- Always verify signatures server-side before creating XMTP clients
- Implement rate limiting to prevent abuse
- Use secure session management

### Data Privacy
- XMTP messages are end-to-end encrypted
- The proxy server only handles routing, not decryption
- Store minimal user data on the proxy server
- Implement proper CORS policies

### Infrastructure
- Use Railway's persistent volumes for XMTP database
- Set up monitoring and logging
- Implement automatic cleanup of inactive clients
- Consider Redis for session/cache management at scale

## Alternative: XMTP HTTP API

If you prefer not to maintain a proxy service, consider using XMTP's HTTP API when it becomes available, or implementing a lightweight relay using XMTP's experimental HTTP bindings.

## Testing

1. **Browser Testing:**
   - Test in regular Chrome/Safari (should use direct XMTP)
   - Test in Farcaster Mini App (should use direct XMTP)

2. **Base App Testing:**
   - Deploy proxy to Railway
   - Test in Base App (should use proxy)
   - Verify messages sync correctly
   - Check that typing indicators work

## Cost Considerations

**Railway Pricing:**
- Hobby plan: $5/month + usage
- Persistent volume: ~$0.25/GB/month
- Estimated cost for MVP: $10-20/month

**Replit vs Railway:**
- **Replit Autoscale:** Good for development, but can be expensive at scale
- **Railway:** Better for production, persistent volumes, and automatic deployments
- **Recommendation:** Use Railway for production XMTP proxy

## Migration Path

1. **Phase 1 (Current):** Improve error messaging for Base App users ✅
2. **Phase 2:** Deploy basic XMTP proxy to Railway (1-2 days)
3. **Phase 3:** Implement conditional routing in frontend (1 day)
4. **Phase 4:** Testing and optimization (1-2 days)
5. **Phase 5:** Monitor and scale as needed

## Resources

- [XMTP Node SDK Documentation](https://github.com/xmtp/xmtp-node-js-tools)
- [Railway Persistent Volumes](https://docs.railway.app/reference/volumes)
- [XMTP Security Best Practices](https://docs.xmtp.org/security)

## Questions?

If you need help implementing this solution or want to discuss alternative approaches, feel free to ask!
