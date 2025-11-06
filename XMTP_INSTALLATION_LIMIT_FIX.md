# XMTP Installation Limit Error - Fix Guide

## 🚨 Problem Summary

You're encountering this error:
```
Cannot register a new installation because the InboxID c91c08e6d05575bc1148967b16d8a5c3a9092fae2473c5848ec364a0968bf103 
has already registered 10/10 installations. Please revoke existing installations first.
```

**Root Cause:** The XMTP Browser SDK v5 was creating a **new installation** every time the client initialized, because installation keys weren't being persisted between sessions. When you migrated from Replit to Railway, all old installations remained registered on the XMTP network, and new ones kept getting created.

## ✅ Fix Applied

I've implemented installation key persistence in `/workspace/hooks/useXMTP.tsx`:

### Key Changes:

1. **Installation Key Storage** (Lines 423-444)
   - Installation keys are now stored in localStorage per wallet address
   - Key format: `xmtp_installation_key_${walletAddress}`
   - Keys are persisted as hex strings for browser storage

2. **Installation Key Reuse** (Lines 446-455)
   - When reconnecting, the stored key is retrieved and used
   - This prevents creating new installations on every connection

3. **Installation Management Functions**
   - `clearLocalInstallationKey()` - Clears the stored key from localStorage
   - `revokeAllInstallations()` - Revokes all installations on the XMTP network

4. **Enhanced Error Handling** (Lines 673-695)
   - Better error messages for installation limit issues
   - Diagnostic information to help troubleshoot

5. **UI Tools** (In `/workspace/app/chat/page.tsx`)
   - Debug panel with installation management buttons
   - Error screen with quick-fix instructions
   - One-click tools to clear keys and retry

## 🔧 How to Fix Your Current Error

### **🚨 IMPORTANT: The 10/10 limit is stored SERVER-SIDE on XMTP**

Clearing localStorage alone won't fix this! The limit is on XMTP's servers, not in your browser.

### **Option 1: Use the Installation Fixer Utility (RECOMMENDED)**

We've created a dedicated tool to help you fix this issue:

1. **Access the Fixer:**
   - When you see the installation limit error, click "🔧 Open Installation Fixer"
   - Or go directly to: `https://your-domain.com/fix-installation-limit.html`

2. **Follow the Guided Process:**
   - The utility will diagnose your issue
   - Clear local keys as a first step
   - Provide multiple solutions based on your situation
   - Export data if needed

3. **What the Fixer Does:**
   - ✅ Scans for all XMTP keys in localStorage
   - ✅ Shows which keys are causing conflicts
   - ✅ Clears installation keys safely
   - ✅ Provides server-side revocation instructions
   - ✅ Exports your XMTP data for backup

### **Option 2: Manual Clear (May Not Work)**

If you want to try manually first:

1. **In Browser Console:**
   ```javascript
   // Find your wallet address from the error/logs
   const walletAddress = 'YOUR_WALLET_ADDRESS_HERE';
   const key = `xmtp_installation_key_${walletAddress.toLowerCase()}`;
   localStorage.removeItem(key);
   console.log('✅ Cleared installation key:', key);
   ```

2. **Or Use the UI:**
   - When you see the error screen, click "🗑️ Quick Clear (May Not Fix)"
   - Then click "Retry Connection"

3. **Why This May Not Work:**
   - This only clears LOCAL data
   - The 10 installations are still registered on XMTP servers
   - You might still hit the limit unless old installations expired

### **Option 3: Revoke Installations on XMTP Server (Backend Required)**

This is the REAL fix if clearing local keys doesn't work:

1. **Backend Must Revoke Installations:**
   - Your agent backend (or any authorized client) needs to connect
   - Run: `await client.revokeAllInstallations()`
   - This clears the 10 installation limit on XMTP servers

2. **Backend Code Example:**
   ```javascript
   import { Client } from '@xmtp/browser-sdk';
   
   // Create client with your wallet signer
   const client = await Client.create(signer, { 
     env: 'production' 
   });
   
   // Get installation count
   const installations = await client.getInstallations();
   console.log(`Current installations: ${installations.length}`);
   
   // Revoke all installations
   await client.revokeAllInstallations();
   console.log('✅ All installations revoked!');
   ```

3. **After Revocation:**
   - Clear your local installation key (use the fixer utility)
   - Refresh and reconnect - should create 1 new installation
   - Installation count should now be 1/10

### **Option 4: Use a Different Wallet**

Each wallet address gets its own InboxID and installation limit:

1. Connect with a different wallet in Pocki Chat
2. This wallet will have a fresh 0/10 installation count
3. Your original wallet remains at 10/10 until revoked

### **Option 5: Wait for Expiration (Last Resort)**

XMTP installations may have expiration periods:
1. Wait 30-90 days (exact period varies)
2. Old installations may expire automatically
3. Not recommended - use Options 3 or 4 instead

## 📊 How to Verify the Fix

After implementing the fix, you should see these logs when connecting:

```
🔑 Found stored installation key, reusing it...
✅ Installation key loaded from storage
✅ Created XMTP client with ReplyCodec and WalletSendCallsCodec
📊 Current installation count: 1
```

If it's your first time after the fix:
```
📝 No stored installation key found, will create new one
✅ Created XMTP client with ReplyCodec and WalletSendCallsCodec
✅ Installation key saved to localStorage for future sessions
📊 This prevents hitting the 10 installation limit
```

## 🎯 Prevention Strategy

The fix I implemented ensures:

1. **One Installation Per Wallet:** Each wallet address gets one stored installation key
2. **Key Persistence:** Keys survive browser refreshes and deployments
3. **Automatic Reuse:** Stored keys are automatically used on reconnection
4. **Cross-Deployment:** Moving between Replit/Railway/Vercel won't create new installations
5. **Debug Tools:** UI tools to manage installations when issues occur

## 🧪 Testing the Fix

1. **First Connection (Fresh Start):**
   ```
   - Clear localStorage
   - Connect wallet
   - Check: New key created and stored
   - Check: Only 1 installation registered
   ```

2. **Reconnection Test:**
   ```
   - Refresh page
   - Reconnect wallet
   - Check: Stored key reused
   - Check: Still only 1 installation
   ```

3. **Multi-Device Test:**
   ```
   - Connect from Device A
   - Connect from Device B
   - Check: Each has its own key
   - Check: Total installations = 2
   ```

## 🔍 Debugging Tools

### **Debug Panel (In Chat UI)**
Click the "🔍 Debug" button to access:
- Installation management tools
- Force sync button
- Diagnostic tests
- Conversation debugging

### **Browser Console Checks**
```javascript
// Check stored keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.includes('xmtp_installation')) {
    console.log('Found key:', key);
    console.log('Value:', localStorage.getItem(key)?.substring(0, 50) + '...');
  }
}

// Clear all XMTP keys (use with caution)
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key?.includes('xmtp')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
}
```

## 🚀 Next Steps

1. **Clear your current invalid key** (Option 1 above)
2. **Deploy the updated code** to Railway
3. **Test the connection** - should create ONE new installation
4. **Verify in logs** - installation key should be saved and reused
5. **Monitor** - installation count should stay at 1 or 2 (if using multiple devices)

## 📝 Notes

- **Agent Backend:** Your agent backend may also need this fix if it's creating multiple installations
- **Multiple Wallets:** Each wallet gets its own installation key (by design)
- **Key Security:** Installation keys are stored in localStorage (browser local storage)
- **Key Format:** Keys are 32 bytes stored as hex strings (e.g., `0x1234...`)

## ⚠️ Important Warnings

1. **Don't clear installation keys unless needed** - they allow you to reconnect
2. **Don't revoke installations unless at limit** - it requires re-signing messages
3. **Back up keys if possible** - export them from localStorage before clearing
4. **Coordinate with agent** - agent and frontend should use different installations

## 📚 References

- XMTP Browser SDK v5: https://github.com/xmtp/xmtp-web
- Installation Limits: 10 per InboxID
- InboxID: Derived from wallet address
- Installation: Each device/session needs one

---

**Status:** ✅ Fix Applied - Ready to Deploy
**Next Action:** Clear your local installation key and reconnect
