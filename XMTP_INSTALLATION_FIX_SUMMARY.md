# XMTP Installation Limit - Quick Summary

## 🤔 Your Question

> "am I supposed to add this to my agent's code?"

## ❌ Answer: NO!

The backend revocation code you saw is **NOT** for your agent's regular code. It's a **one-time maintenance script** to fix the installation limit problem.

---

## 📊 What You Already Have

Your Pocki Chat frontend **already has** revocation built-in:

```45:46:hooks/useXMTP.tsx
  revokeAllInstallations: () => Promise<void>;
  clearLocalInstallationKey: () => void;
```

Users can trigger this from your UI. **This is fine and should stay!**

---

## 🛠️ What I Just Created For You

### 1. **Backend Revocation Script** (ONE-TIME USE)
   - Location: `scripts/revoke-xmtp-installations.mjs`
   - Purpose: Manually clear installations when frontend doesn't work
   - Usage: Run ONCE when you hit 10/10 limit

### 2. **Easy Command**
   ```bash
   npm run xmtp:revoke
   ```

### 3. **Full Instructions**
   - See: `scripts/README.md`

---

## 🎯 What To Do Now

### If You're Currently at 10/10:

1. **Run the script once:**
   ```bash
   npm run xmtp:revoke
   ```

2. **Clear browser storage:**
   - Open browser console on Pocki Chat
   - Run:
     ```javascript
     Object.keys(localStorage)
       .filter(key => key.startsWith('xmtp_'))
       .forEach(key => localStorage.removeItem(key));
     ```

3. **Refresh and reconnect** - You'll be at 1/10! 🎉

### If You're Not at 10/10:

- **Do nothing!** Your code already prevents this issue
- Your app reuses installation keys (lines 427-484 in useXMTP.tsx)
- You won't hit the limit again

---

## 📝 Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Pocki Chat)                                   │
│ ├─ useXMTP.tsx                                          │
│ │  ├─ Reuses installation keys ✅                       │
│ │  ├─ User can trigger revocation from UI ✅            │
│ │  └─ Prevents future 10/10 errors ✅                   │
│ └─ This is your MAIN code - keep it!                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Backend Script (ONE-TIME MAINTENANCE)                   │
│ ├─ scripts/revoke-xmtp-installations.mjs                │
│ │  └─ Run manually when frontend broken                 │
│ └─ NOT part of agent code                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Agent (Pocki AI)                                        │
│ └─ NO revocation code needed here ✅                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

1. ✅ **Frontend revocation** (`revokeAllInstallations` in useXMTP.tsx) = Keep it!
2. ✅ **Backend script** (scripts folder) = Use once if needed, not in agent
3. ❌ **Don't add revocation to your agent's code**
4. ✅ **Your app already prevents the issue** (installation key reuse)

---

## 🆘 Still Confused?

Think of it like this:

- **Frontend**: Like a "Reset Password" button on your website (good!)
- **Backend Script**: Like a database admin tool (one-time fixes only!)
- **Agent Code**: Your AI that chats with users (NO revocation needed!)

The revocation code is a **tool**, not a **feature** of your agent.
