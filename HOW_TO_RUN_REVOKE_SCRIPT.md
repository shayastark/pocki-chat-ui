# How To Run The XMTP Revocation Script

## ⚠️ IMPORTANT: This runs on YOUR LOCAL MACHINE, not on Railway!

---

## 🎯 When To Use This

Run this script ONLY when:
- ✅ **You** (the developer) hit 10/10 installations while testing
- ✅ You have access to the private key of the wallet that hit the limit
- ✅ You're running this on your local development machine

Do NOT run this:
- ❌ On Railway or any production server
- ❌ For your agent's wallet (agent doesn't need it)
- ❌ For users (they use the frontend UI)

---

## 📍 Step-by-Step Instructions

### Step 1: Open Terminal on Your Computer

**Mac/Linux:**
```bash
# Open Terminal app
# Navigate to your project
cd ~/path/to/pocki-chat
```

**Windows:**
```bash
# Open Command Prompt or PowerShell
# Navigate to your project
cd C:\path\to\pocki-chat
```

### Step 2: Verify You're in the Right Place

```bash
# Check you're in the project directory
ls -la

# You should see:
# - package.json
# - scripts/
# - components/
# etc.
```

### Step 3: Run the Script

```bash
npm run xmtp:revoke
```

### Step 4: Follow the Prompts

The script will ask for your private key:

```
╔════════════════════════════════════════════════════════════╗
║   XMTP Installation Cleanup Script                        ║
║   ⚠️  ONE-TIME USE ONLY - NOT FOR PRODUCTION CODE         ║
╚════════════════════════════════════════════════════════════╝

📝 Enter your wallet's private key:
   (This stays on your machine - never shared)
Private Key (0x...): 
```

**Enter your wallet's private key** (the one that hit 10/10)

### Step 5: Confirm Revocation

```
⚠️  WARNING: This will revoke ALL installations!
   You will need to reconnect all devices.

Are you sure? (yes/no): 
```

Type `yes` and press Enter.

### Step 6: Wait for Completion

```
✅ All installations revoked!
📊 Now at 0/10 installations

╔════════════════════════════════════════════════════════════╗
║                    ✨ NEXT STEPS ✨                        ║
╠════════════════════════════════════════════════════════════╣
║ 1. Clear your browser's XMTP data                         ║
║ 2. Refresh your Pocki Chat app                            ║
║ 3. Reconnect - you'll be at 1/10! 🎉                     ║
╚════════════════════════════════════════════════════════════╝
```

### Step 7: Clear Browser Storage

1. Open Pocki Chat in your browser
2. Open browser console (F12 or Right-click → Inspect)
3. Go to the "Console" tab
4. Paste this and press Enter:

```javascript
Object.keys(localStorage)
  .filter(key => key.startsWith('xmtp_'))
  .forEach(key => localStorage.removeItem(key));
console.log('✅ Cleared all XMTP keys');
```

### Step 8: Refresh and Reconnect

1. Refresh the Pocki Chat page (Ctrl+R or Cmd+R)
2. Connect your wallet
3. You're now at 1/10! 🎉

---

## 🔐 Security Notes

### Is This Safe?

**YES**, because:
- ✅ Runs locally on YOUR machine
- ✅ Never sends your key anywhere
- ✅ Script code is in your repo (you can audit it)
- ✅ Only you see the private key input

### Best Practices

- ⚠️ Don't paste your private key in public chats
- ⚠️ Make sure you're in the right directory
- ⚠️ Use a testing wallet, not your main wallet
- ⚠️ Close the terminal after running (clears history)

---

## 🆘 Troubleshooting

### Error: "Cannot find module '@xmtp/browser-sdk'"

**Solution:** You're running it on a machine without dependencies installed.

```bash
# Install dependencies first
npm install

# Then try again
npm run xmtp:revoke
```

### Error: "command not found: npm"

**Solution:** Node.js is not installed on this machine.

1. Download Node.js from https://nodejs.org/
2. Install it
3. Restart your terminal
4. Try again

### Error: "Module not found" or "Cannot use import statement"

**Solution:** Check the script file extension.

```bash
# Should be .mjs, not .js
ls scripts/
# You should see: revoke-xmtp-installations.mjs
```

### Error: "Failed to connect to XMTP"

**Solution:** Check your private key format.

- ✅ Should start with `0x`
- ✅ Should be 64 hex characters after `0x`
- ❌ Don't include spaces or quotes

---

## ❓ FAQ

### Q: Can I run this on Railway?

**A:** No! This is for YOUR local machine, not for the agent deployment.

### Q: Should I add this to my deployment scripts?

**A:** No! This is a one-time maintenance tool, not part of your app.

### Q: What if I don't have the private key?

**A:** Then you can't run this script. The wallet owner must run it.

### Q: Can users run this script?

**A:** No. Users should use the frontend UI buttons (already built in your app).

### Q: Will this affect my agent?

**A:** No. This only affects the wallet whose private key you enter.

### Q: Do I need to run this regularly?

**A:** No! Once fixed, your app reuses installation keys and won't hit the limit again.

---

## 📞 Still Stuck?

If you're still confused about where to run this:

1. **Are you the developer testing the app?** → Run it on your laptop/desktop
2. **Is a user having issues?** → They use the frontend, not this script
3. **Is your agent having issues?** → Check agent logs, don't run this script

**Remember:** This script is like a "reset tool" for YOUR testing wallet, not a deployment artifact!
