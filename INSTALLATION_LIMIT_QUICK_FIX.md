# 🚨 10/10 Installation Limit - Quick Fix Guide

## What's Happening?

You're seeing this error:
```
Cannot register a new installation because the InboxID has already registered 10/10 installations.
```

**The key issue:** Running `localStorage.removeItem("xmtp_installation_key_...")` **only clears LOCAL data**. The 10 installations are stored **SERVER-SIDE on XMTP's network**, not in your browser!

---

## 🔧 Quick Solutions (Choose One)

### ✅ Solution 1: Use the Installation Fixer Tool (EASIEST)

We've created a dedicated utility to help you:

1. **Access it:**
   - Navigate to `/fix-installation-limit.html` in your browser
   - Or click "🔧 Open Installation Fixer" on the error screen

2. **What it does:**
   - Scans all XMTP keys in your browser
   - Clears corrupted local keys
   - Provides step-by-step recovery options
   - Exports your data for backup

3. **Follow the guided process** - it will tell you exactly what to do!

---

### ✅ Solution 2: Try with Clean Browser State

Sometimes old installations expire on their own:

1. **Clear XMTP data:**
   ```javascript
   // Run in browser console
   for (let i = localStorage.length - 1; i >= 0; i--) {
     const key = localStorage.key(i);
     if (key?.toLowerCase().includes('xmtp')) {
       localStorage.removeItem(key);
       console.log('Removed:', key);
     }
   }
   ```

2. **Refresh and try connecting** - might work if installations expired

---

### ✅ Solution 3: Connect with Different Wallet (IMMEDIATE FIX)

Each wallet address has its own installation limit:

1. Disconnect your current wallet
2. Connect with a different wallet address
3. Fresh wallet = 0/10 installations = works immediately!

---

### ✅ Solution 4: Backend Revocation (PERMANENT FIX)

This is the **real solution** but requires backend access:

#### If You Have Backend Access:

```javascript
import { Client } from '@xmtp/browser-sdk';

// 1. Connect with your wallet
const client = await Client.create(signer, { 
  env: 'production' 
});

// 2. Check installation count
const installations = await client.getInstallations();
console.log(`Current: ${installations.length}/10`);

// 3. Revoke all installations
await client.revokeAllInstallations();
console.log('✅ All cleared! Now at 0/10');
```

#### After Backend Revocation:

1. Clear your browser's XMTP keys (use Solution 1 or 2)
2. Refresh the page
3. Connect - should create 1 new installation
4. You're back to 1/10!

---

## 🎯 Which Solution Should You Use?

| Situation | Best Solution |
|-----------|---------------|
| **Quick test, don't care about wallet** | Solution 3: Different Wallet |
| **Need same wallet, no backend access** | Solution 1: Fixer Tool → Try cleaning |
| **Need same wallet, have backend access** | Solution 4: Backend Revocation |
| **Developer/Technical user** | Solution 2: Manual clear + retry |

---

## 📊 Why Did This Happen?

### Root Cause
The XMTP SDK creates a new installation every time you connect WITHOUT a stored installation key. You likely:

1. Cleared browser cache/localStorage multiple times
2. Tested on multiple devices
3. Switched between dev/production
4. Migrated between hosting platforms (Replit → Railway)

Each connection = 1 new installation → Hit the 10 limit!

### The Fix Applied
Your codebase now includes installation key persistence (see `/workspace/hooks/useXMTP.tsx` lines 427-484):

- ✅ Stores installation keys in localStorage
- ✅ Reuses keys on reconnection
- ✅ Prevents creating new installations
- ✅ One key per wallet address

**Going forward:** You won't hit this limit again! But you need to clear the existing 10 installations first.

---

## 🔍 Diagnostic Commands

Run these in your browser console to see what's stored:

```javascript
// 1. Check for XMTP installation keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.includes('xmtp_installation_key')) {
    console.log('Found key:', key);
    console.log('Value length:', localStorage.getItem(key)?.length);
  }
}

// 2. Check your wallet address
console.log('Active wallet:', 'YOUR_WALLET_ADDRESS_HERE');

// 3. Expected key format
const wallet = 'YOUR_WALLET_ADDRESS_HERE';
const expectedKey = `xmtp_installation_key_${wallet.toLowerCase()}`;
console.log('Expected key:', expectedKey);
console.log('Key exists:', !!localStorage.getItem(expectedKey));

// 4. Clear specific key
localStorage.removeItem(expectedKey);
console.log('✅ Cleared');
```

---

## 🆘 Still Stuck?

### Immediate Workarounds:
1. **Use a different wallet** (fastest)
2. **Try incognito/private browsing** (fresh state)
3. **Use the fixer tool** at `/fix-installation-limit.html`

### Need Backend Help?
- Contact your backend team
- Share Solution 4 code above
- They need to run `revokeAllInstallations()`

### For Developers:
- Check XMTP docs: https://xmtp.org
- Installation management: https://github.com/xmtp/xmtp-web
- Debug panel in app (🔍 button) has installation tools

---

## ✅ Success Checklist

After applying a fix, verify:

- [ ] Can connect to XMTP without errors
- [ ] See "1/10 installations" in console logs
- [ ] Installation key saved to localStorage
- [ ] Key reused on page refresh (doesn't create new installation)
- [ ] Messages send and receive successfully

---

## 📝 Prevention Tips

To never hit this limit again:

1. ✅ **Already fixed** - Code now persists installation keys
2. **Don't clear localStorage** unless necessary
3. **One device = one installation** is now maintained
4. **Export keys** before clearing browser data
5. **Check the debug panel** to monitor installation count

---

**Need more help?** Use the fixer tool at `/fix-installation-limit.html` or check the debug panel in the chat interface (🔍 button).
