# Fix: Agent Address vs Inbox ID Mismatch

## 🚨 Your Problem

You're seeing in the debug panel:

```
Client Inbox ID: c91c08e6d05575bc1148967b16d8a5c3a9092fae2473c5848ec364a0968bf103
Target Agent Inbox ID: 0xd003c8136e974da7317521ef5866c250f17ad155
Active Conv Peer Inbox ID: 0xd003c8136e974da7317521ef5866c250f17ad155:c91c08e6d05575bc11489
✗ MISMATCH! Sending to wrong conversation!
```

And when you try to send messages, you get server-side alerts.

## 🎯 Root Cause

**You're using an Ethereum address instead of an XMTP Inbox ID!**

### XMTP V3 Uses Inbox IDs, Not Addresses

| Type | Format | Example |
|------|--------|---------|
| ❌ **Ethereum Address** | `0x` + 40 hex chars | `0xd003c8136e974da7317521ef5866c250f17ad155` |
| ✅ **XMTP Inbox ID** | 64 hex chars (no `0x`) | `c91c08e6d05575bc1148967b16d8a5c3a9092fae2473c5848ec364a0968bf103` |

### Why This Breaks

- XMTP Browser SDK (v5) uses **inbox IDs** to identify users
- Your `NEXT_PUBLIC_AGENT_ADDRESS` is set to an Ethereum address
- When creating conversations, XMTP can't find the correct inbox
- Messages get routed to a malformed conversation ID
- Result: Server-side errors when trying to send messages

### The Weird Peer Inbox ID

The format you're seeing:
```
0xd003c8136e974da7317521ef5866c250f17ad155:c91c08e6d05575bc11489
```

This is XMTP's internal representation when it tries to create a conversation with an address but can't properly resolve it. It's concatenating:
- Your Ethereum address: `0xd003c8136e974da7317521ef5866c250f17ad155`
- A partial inbox ID fragment: `c91c08e6d05575bc11489`

This is NOT a valid conversation identifier, which is why messages fail.

---

## ✅ Solution

### Step 1: Get Your Agent's Inbox ID

Run this script on your local machine (where you have your agent's private key):

```bash
npm run xmtp:get-inbox-id
```

Or directly:
```bash
node scripts/get-agent-inbox-id.mjs
```

**What it does:**
1. Prompts for your agent's private key
2. Connects to XMTP
3. Retrieves the inbox ID
4. Displays both address and inbox ID

**Example output:**
```
╔════════════════════════════════════════════════════════════╗
║                  📋 YOUR AGENT'S INFO                      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ Wallet Address:                                            ║
║ 0xd003c8136e974da7317521ef5866c250f17ad155               ║
║                                                            ║
║ XMTP Inbox ID (USE THIS!):                                 ║
║ a1b2c3d4e5f6...123456789 (64 chars)                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Step 2: Update Environment Variable

**Local Development (.env.local):**
```bash
NEXT_PUBLIC_AGENT_ADDRESS=<your_agent_inbox_id>
```

**Railway/Production:**
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Update `NEXT_PUBLIC_AGENT_ADDRESS` with the inbox ID
5. Redeploy

### Step 3: Verify the Fix

After updating and redeploying:

1. **Clear your browser's XMTP keys** (fresh start)
   ```javascript
   // In browser console
   Object.keys(localStorage)
     .filter(key => key.includes('xmtp'))
     .forEach(key => localStorage.removeItem(key));
   ```

2. **Refresh and reconnect**

3. **Check debug panel** - should now show:
   ```
   Target Agent Inbox ID: a1b2c3d4e5f6...123456789 (64 chars)
   Active Conv Peer Inbox ID: a1b2c3d4e5f6...123456789 (64 chars)
   ✓ MATCH
   ```

4. **Send a test message** - should work!

---

## 🔍 Understanding Inbox IDs

### What is an Inbox ID?

An **Inbox ID** is XMTP V3's unique identifier for a user's XMTP identity.

**Key points:**
- ✅ Tied to your wallet address (derived from it)
- ✅ Permanent - always the same for a given wallet
- ✅ Required for XMTP Browser SDK V3+
- ✅ 64 hexadecimal characters (32 bytes)
- ✅ No `0x` prefix

### Address vs Inbox ID Relationship

```
Wallet Address (Ethereum)
    ↓
    [XMTP creates account]
    ↓
Inbox ID (XMTP V3)
```

- One wallet → One inbox ID (permanent mapping)
- Inbox ID is generated when first connecting to XMTP
- Same wallet will always get the same inbox ID

### Why Not Use Addresses?

XMTP V2 used Ethereum addresses directly. V3 introduced inbox IDs because:
- Support for multi-device installations
- Better security model
- Account abstraction support
- Installation management (the 10 installation limit)

---

## 🛠️ Technical Details

### How the Script Works

```javascript
// Connect to XMTP with your wallet
const client = await Client.create(signer, { env: 'production' });

// Get inbox ID
console.log(client.inboxId); // This is what you need!
```

### Current vs Correct Configuration

**❌ Current (Wrong):**
```bash
# .env or Railway Variables
NEXT_PUBLIC_AGENT_ADDRESS=0xd003c8136e974da7317521ef5866c250f17ad155
```

**✅ Correct:**
```bash
# .env or Railway Variables
NEXT_PUBLIC_AGENT_ADDRESS=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Where It's Used in Code

```typescript
// lib/constants.ts
export const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '';

// hooks/useXMTP.tsx
const conv = await (newClient.conversations as any).newDm(AGENT_ADDRESS);
//                                                          ^^^^^^^^^^^^
//                                                   This must be an inbox ID!
```

---

## 📝 Files Changed

### New Files
- ✅ `/workspace/scripts/get-agent-inbox-id.mjs` - Script to retrieve inbox ID
- ✅ `/workspace/AGENT_INBOX_ID_FIX.md` - This documentation

### Updated Files
- ✅ `/workspace/package.json` - Added `xmtp:get-inbox-id` script

### Environment Changes Required
- ⚠️ Update `NEXT_PUBLIC_AGENT_ADDRESS` in your deployment
- ⚠️ Use the 64-character inbox ID, not the Ethereum address

---

## 🧪 Testing Checklist

After making the changes:

- [ ] Run `npm run xmtp:get-inbox-id` to get the correct inbox ID
- [ ] Update environment variable with the inbox ID (not address!)
- [ ] Redeploy your application
- [ ] Clear browser's XMTP keys (localStorage)
- [ ] Refresh and reconnect
- [ ] Check debug panel shows matching inbox IDs
- [ ] Send a test message
- [ ] Verify message appears in conversation
- [ ] Check agent receives the message

---

## ⚠️ Important Notes

### About Your Agent

Your agent's backend also needs to use the same inbox ID when sending messages back to users. Make sure your agent:
1. Connects to XMTP with the same wallet
2. Uses inbox IDs (not addresses) for DMs
3. Is on the same XMTP environment (production/dev)

### Environments

The inbox ID is **environment-specific**:
- Production environment → Production inbox ID
- Dev environment → Different inbox ID

Make sure both your frontend and agent are on the same XMTP environment!

### Installation Count

Getting the inbox ID doesn't create a new installation. The script simply retrieves the existing inbox ID that's already tied to your wallet.

---

## 🆘 Troubleshooting

### "Cannot find inbox ID"

If the script fails:
1. **Check environment:** Make sure `NEXT_PUBLIC_XMTP_ENV` matches your agent's environment
2. **First-time connection:** If this wallet never connected to XMTP, it will create the inbox ID during the script run
3. **Network issues:** Ensure you can reach XMTP network

### "Still seeing mismatch"

If the debug panel still shows a mismatch:
1. **Clear cache:** Full browser refresh (Ctrl+Shift+R)
2. **Verify deployment:** Check Railway shows the updated env var
3. **Check build logs:** Ensure the new value was picked up
4. **Try different browser:** Rule out caching issues

### "Agent not responding"

If messages send but no response:
1. **Check agent's inbox ID:** Agent must use the same inbox ID
2. **Verify environment:** Both must be on same XMTP env (production/dev)
3. **Check agent logs:** See if agent receives the messages

---

## 📚 Additional Resources

- [XMTP V3 Documentation](https://xmtp.org/docs/build/get-started)
- [Browser SDK Guide](https://github.com/xmtp/xmtp-web)
- [Installation Management](../XMTP_INSTALLATION_FIX_SUMMARY.md)

---

**Status:** ✅ Fix Available - Run Script to Get Inbox ID  
**Next Action:** Run `npm run xmtp:get-inbox-id` and update your env var  
**Date:** 2025-11-06
