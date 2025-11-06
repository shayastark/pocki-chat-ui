# Complete Fix: Replit → Railway Migration Issues

## 🚨 What Happened

After migrating from Replit to Railway, you experienced a cascade of issues:

1. ✅ **FIXED:** Hexadecimal digit error (corrupted installation key)
2. ⚠️ **CURRENT:** Address vs Inbox ID mismatch (messages fail)

## 🎯 Root Cause

Your `NEXT_PUBLIC_AGENT_ADDRESS` is set to an **Ethereum address** instead of an **XMTP Inbox ID**.

### Current Configuration (Wrong)
```bash
NEXT_PUBLIC_AGENT_ADDRESS=0xd003c8136e974da7317521ef5866c250f17ad155
```

### What You Need (Correct)
```bash
NEXT_PUBLIC_AGENT_ADDRESS=<agent's_64_char_inbox_id>
```

---

## ✅ Step-by-Step Fix

### Step 1: Get Your Agent's Inbox ID

**IMPORTANT:** You need the inbox ID for your **AGENT's wallet**, not your testing wallet!

1. **On your local machine**, run:
   ```bash
   npm run xmtp:get-inbox-id
   ```

2. **When prompted for private key:**
   - ✅ Use your **AGENT's** private key (for `0xd003c8136e974da7317521ef5866c250f17ad155`)
   - ❌ NOT your personal testing wallet's private key

3. **Copy the Inbox ID** (64 hex characters)
   ```
   Example: a1b2c3d4e5f6...123456 (will be different for your agent)
   ```

### Step 2: Update Railway Environment Variable

1. Go to **Railway Dashboard**
2. Select your **Pocki Chat** project
3. Click on your service
4. Go to **Variables** tab
5. Find `NEXT_PUBLIC_AGENT_ADDRESS`
6. **Replace** the Ethereum address with the 64-character inbox ID
7. Click **Update** or **Save**
8. Railway will automatically redeploy

### Step 3: Clear Your Browser's XMTP Keys

Since you've been testing with the wrong configuration, clear everything:

**In Browser Console (F12):**
```javascript
// Clear all XMTP data for fresh start
Object.keys(localStorage)
  .filter(key => key.includes('xmtp'))
  .forEach(key => localStorage.removeItem(key));
  
console.log('✅ Cleared all XMTP keys. Refresh the page.');
```

Or use the utility page:
```
https://your-app.railway.app/clear-xmtp-keys.html
```

### Step 4: Test the Fix

1. **Wait for Railway redeploy** (usually 2-3 minutes)
2. **Hard refresh** your app (Ctrl+Shift+R or Cmd+Shift+R)
3. **Connect your wallet**
4. **Check debug panel:**
   ```
   Target Agent Inbox ID: a1b2c3d4... (64 chars, no 0x prefix)
   Active Conv Peer Inbox ID: a1b2c3d4... (same as above)
   ✓ MATCH
   ```
5. **Send a test message** - should work!

---

## 🔍 Why This Worked on Replit But Not Railway

### Replit Configuration

Your Replit setup probably had one of these:

**Option A: Correct Inbox ID**
```bash
# Replit .env
NEXT_PUBLIC_AGENT_ADDRESS=c91c08e6...correct_inbox_id
```

**Option B: Different XMTP Version**
- Replit might have been using XMTP V2 SDK
- V2 accepts Ethereum addresses directly
- V3 requires inbox IDs

**Option C: Direct Code**
- Replit might have had inbox ID hardcoded
- Not reading from env var

### Railway Configuration

When you migrated:
```bash
# Railway Variables (Wrong!)
NEXT_PUBLIC_AGENT_ADDRESS=0xd003c8136e974da7317521ef5866c250f17ad155
```

**Why this breaks:**
- XMTP Browser SDK v5 (V3 protocol) requires inbox IDs
- Ethereum addresses are not valid conversation identifiers in V3
- Creates malformed conversation IDs
- Messages fail to route

---

## 📊 Before vs After

### Before Fix

```
User Wallet → XMTP Client
    ↓
Try to create DM with: 0xd003c8136e974da7317521ef5866c250f17ad155
    ↓
XMTP can't resolve address to inbox ID
    ↓
Creates malformed conversation: 0xd003...c250:c91c08e6...
    ↓
Messages fail with server error
```

### After Fix

```
User Wallet → XMTP Client
    ↓
Try to create DM with: a1b2c3d4e5f6...123456 (agent's inbox ID)
    ↓
XMTP finds agent's inbox
    ↓
Creates valid conversation
    ↓
Messages deliver successfully ✅
```

---

## 🛠️ Technical Details

### XMTP V2 vs V3

| Feature | V2 | V3 (Browser SDK v5) |
|---------|----|--------------------|
| Identifier | Ethereum address | Inbox ID |
| Format | `0x` + 40 hex chars | 64 hex chars |
| Example | `0xd003...d155` | `c91c08e6...bf103` |
| Multi-device | No | Yes (installations) |
| DM Creation | `client.conversations.newConversation(address)` | `client.conversations.newDm(inboxId)` |

### Why Inbox IDs?

XMTP V3 introduced inbox IDs to support:
- **Multi-device sync** - Multiple installations per inbox
- **Account abstraction** - Smart contract wallets
- **Better security** - Separate identity from keys
- **Installation management** - The 10 installation limit

### Getting Inbox ID from Address

There's no direct API call. You must:
1. Connect to XMTP with the wallet
2. Read `client.inboxId`
3. Store that ID for future use

That's why you need to run the script with your agent's private key.

---

## 🚦 Verification Checklist

After applying the fix:

### ✅ Railway Deployment
- [ ] Environment variable shows 64-char inbox ID (no `0x` prefix)
- [ ] Latest deployment is running
- [ ] No build errors in logs

### ✅ Browser Console
- [ ] No XMTP initialization errors
- [ ] Client connects successfully
- [ ] Installation key is created/loaded properly

### ✅ Debug Panel
- [ ] Target Agent Inbox ID shows 64-char hex
- [ ] Active Conv Peer Inbox ID matches target
- [ ] Shows "✓ MATCH" in green
- [ ] Total conversations: 1 (or as expected)

### ✅ Messaging
- [ ] Can send test message
- [ ] Message appears in conversation
- [ ] No server-side alerts
- [ ] Agent receives message (check agent logs)

---

## 🔄 If You Need to Reset Everything

If things are still wonky after the fix:

### Full Reset Procedure

1. **Clear Railway Database** (if applicable)
2. **Clear Browser Data:**
   ```javascript
   // Clear ALL localStorage
   localStorage.clear();
   
   // Or just XMTP keys
   Object.keys(localStorage)
     .filter(key => key.includes('xmtp'))
     .forEach(key => localStorage.removeItem(key));
   ```

3. **Hard Refresh** (Ctrl+Shift+R)

4. **Reconnect** with fresh state

5. **Check Installation Count:**
   ```bash
   npm run xmtp:revoke  # If at 10/10
   ```

---

## 🆘 Common Issues

### "Script fails to get inbox ID"

**Problem:** Can't connect to XMTP  
**Solution:**
1. Check your agent's private key is correct
2. Ensure `NEXT_PUBLIC_XMTP_ENV` matches agent's environment
3. Try with `production` environment explicitly

### "Still seeing address in debug panel"

**Problem:** Railway didn't pick up the change  
**Solution:**
1. Verify the env var is saved in Railway
2. Manually trigger a redeploy
3. Check build logs for the new value
4. Hard refresh browser (clear cache)

### "Messages still fail"

**Problem:** Conversations created with old config  
**Solution:**
1. Clear all XMTP localStorage keys
2. Hard refresh
3. Reconnect to create fresh conversation
4. Test again

### "Agent not responding"

**Problem:** Agent's configuration also wrong  
**Solution:**
1. Check agent's backend is using inbox ID (not address)
2. Verify agent and frontend are on same XMTP environment
3. Check agent's logs for message receipt

---

## 📝 Migration Checklist (For Future Reference)

When migrating XMTP apps between platforms:

### Environment Variables
- [ ] `NEXT_PUBLIC_AGENT_ADDRESS` - **Use inbox ID, not address!**
- [ ] `NEXT_PUBLIC_XMTP_ENV` - Match agent's environment
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` - Copy from Privy dashboard
- [ ] All other env vars from original deployment

### XMTP Considerations
- [ ] Know the difference: V2 uses addresses, V3 uses inbox IDs
- [ ] Get inbox IDs for all agents/bots
- [ ] Document installation count before migration
- [ ] Clear browser localStorage after migration

### Testing Procedure
- [ ] Test with fresh browser/incognito mode
- [ ] Verify debug panel shows correct inbox IDs
- [ ] Send test message and verify delivery
- [ ] Check agent receives and responds
- [ ] Monitor installation count (should stay low)

---

## 💡 Key Takeaways

### What Broke
1. ❌ Environment variable had Ethereum address instead of inbox ID
2. ❌ Installation keys got corrupted during testing
3. ❌ Hit 10/10 installation limit from multiple reconnects

### What We Fixed
1. ✅ Cleared corrupted installation keys (hexadecimal error)
2. ✅ Created script to get agent's inbox ID
3. ✅ Added validation to prevent future key corruption
4. ⏳ Need to update env var with correct inbox ID

### What You Need to Do
1. Run script with **agent's** private key (not yours!)
2. Update Railway env var with the inbox ID
3. Clear browser's XMTP keys
4. Test messaging

---

## 📚 Related Documentation

- `/workspace/AGENT_INBOX_ID_FIX.md` - Detailed inbox ID explanation
- `/workspace/HEXADECIMAL_ERROR_FIX.md` - Corrupted key fix
- `/workspace/XMTP_INSTALLATION_FIX_SUMMARY.md` - Installation management
- `/workspace/HOW_TO_RUN_REVOKE_SCRIPT.md` - Revocation guide

---

**Status:** ⚠️ Waiting for Inbox ID  
**Next Action:** Run `npm run xmtp:get-inbox-id` with agent's private key  
**Then:** Update Railway environment variable  
**Date:** 2025-11-06
