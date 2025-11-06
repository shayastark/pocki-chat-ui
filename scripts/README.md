# XMTP Installation Cleanup

## 🚨 Problem: "10/10 installations" Error

XMTP has a limit of 10 installations per wallet. If you hit this limit, you need to revoke old installations.

## ✅ Solution: Run This Script ONCE

### Step 1: Install Dependencies

```bash
npm install viem
```

### Step 2: Get Your Private Key

You need the private key for the wallet that's hitting the installation limit.

**⚠️ Security Note:** This script runs locally on your machine and never sends your key anywhere. But still, be careful!

### Step 3: Run the Script

**Easy way:**
```bash
npm run xmtp:revoke
```

**Or directly:**
```bash
node scripts/revoke-xmtp-installations.mjs
```

Follow the prompts:
1. Enter your wallet's private key (starts with 0x)
2. Wait for XMTP connection (may require signature approvals)
3. Confirm the revocation
4. Done! ✨

### Step 4: Clear Browser Storage

After revocation, you need to clear your browser's XMTP data:

1. Open your Pocki Chat in browser
2. Open browser console (F12)
3. Run this command (replace YOUR_ADDRESS with your wallet address):

```javascript
localStorage.removeItem("xmtp_installation_key_YOUR_ADDRESS")
```

Or just clear all XMTP keys:

```javascript
Object.keys(localStorage)
  .filter(key => key.startsWith('xmtp_'))
  .forEach(key => localStorage.removeItem(key));
```

### Step 5: Refresh

Refresh your Pocki Chat page and reconnect. You'll now be at 1/10! 🎉

---

## 🤔 FAQ

### Q: Should I add this to my agent's code?

**NO!** This is a one-time maintenance script. Your agent should NOT automatically revoke installations.

### Q: What about the `revokeAllInstallations()` function in my frontend?

That's fine! It lets users manually trigger revocation from the UI. The backend script is just another way to do the same thing, useful when the frontend isn't working.

### Q: Do I need to run this regularly?

No! Once you fix the issue and start reusing installation keys (which your code already does), you should never hit the limit again.

### Q: What if I'm using the 'dev' environment?

Edit the script and change:
```javascript
env: 'production'  // Change to 'dev'
```

to:

```javascript
env: 'dev'
```
