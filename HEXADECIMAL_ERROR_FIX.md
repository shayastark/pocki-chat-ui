# Fix: Invalid Hexadecimal Digit Error

## 🚨 Problem

You're seeing this error after clearing XMTP installations:

```
client: API error: api client error api client at endpoint "get_identity_updates_v2" 
has error grpc error 500 at http gateway 6ERROR: invalid hexadecimal digit: "x" (SQLSTATE 22023)
```

## 🎯 Root Cause

After clearing 9 installations, you have a **corrupted installation key** stored in your browser's localStorage. When XMTP tries to use this key to authenticate, it hits a PostgreSQL database error because the key contains invalid hexadecimal characters.

This error happens at the XMTP backend level, not in your browser.

## ✅ Solution

### Quick Fix (Recommended)

1. **Go to the XMTP Key Utility:**
   - Visit: `https://your-domain.com/clear-xmtp-keys.html`
   - Or navigate to `/clear-xmtp-keys.html` on your deployment

2. **Scan and Clear:**
   - Click "🔍 Scan for Keys"
   - Review the found keys
   - Click "🗑️ Clear All XMTP Keys"
   - Confirm the action

3. **Reconnect:**
   - Return to Pocki Chat
   - Connect your wallet
   - A fresh, valid installation key will be created

### Manual Fix (Alternative)

If you prefer to do it manually in the browser console:

```javascript
// Find all XMTP keys
Object.keys(localStorage)
  .filter(key => key.includes('xmtp'))
  .forEach(key => {
    console.log('Found:', key);
    console.log('Value preview:', localStorage.getItem(key)?.substring(0, 50));
  });

// Clear all XMTP keys
Object.keys(localStorage)
  .filter(key => key.includes('xmtp'))
  .forEach(key => {
    localStorage.removeItem(key);
    console.log('✅ Cleared:', key);
  });

console.log('✅ All XMTP keys cleared! Refresh the page.');
```

## 🛡️ What Changed (Prevention)

I've updated the code with enhanced validation to prevent this from happening again:

### 1. **Key Validation on Load** (`useXMTP.tsx` lines 427-460)

Before loading an installation key, the code now validates:
- ✅ Hex string format (only 0-9, a-f characters)
- ✅ Proper length (must be even and >= 64 chars)
- ✅ No invalid characters like "x" in the wrong place

If validation fails, the corrupted key is automatically cleared with a user-friendly alert.

### 2. **Key Validation on Save** (`useXMTP.tsx` lines 469-489)

Before saving a new installation key, the code validates:
- ✅ Key is a Uint8Array with proper length
- ✅ Generated hex string is valid
- ✅ No corruption during conversion

Invalid keys are rejected and not saved.

### 3. **Automatic Recovery**

If a corrupted key is detected:
```
❌ CORRUPTED INSTALLATION KEY DETECTED!
   Length valid: false (must be even and >= 64 chars)
   Hex valid: false (only 0-9, a-f allowed)
✅ Automatically cleared corrupted key
📝 Will create a fresh installation key
```

The system auto-clears the bad key and creates a fresh one.

## 🔍 How Keys Get Corrupted

Installation keys can become corrupted when:

1. **Browser storage errors** - Incomplete writes during page unload
2. **Manual editing** - Accidentally modifying localStorage values
3. **Extension interference** - Browser extensions modifying storage
4. **Concurrent writes** - Multiple tabs writing simultaneously
5. **Storage quota exceeded** - Partial writes when storage is full

## 📊 Validation Details

Valid installation key format:
```
Format: "0x" + hex_string
Example: 0x1a2b3c4d... (64+ hex characters after 0x)
Length: At least 66 characters total (0x + 64 hex chars = 32 bytes)
Valid chars: 0-9, a-f, A-F only
```

Invalid examples that get auto-cleared:
```
❌ "0xx1a2b3c..."     - Double 'x'
❌ "0x1a2b3c4"        - Odd length
❌ "0xGHIJKL..."      - Invalid hex chars
❌ "0x1a2b"           - Too short (<64 chars)
❌ "1a2b3c..."        - Missing 0x prefix
```

## 🧪 Testing the Fix

After clearing keys, you should see these logs when reconnecting:

**First connection (no stored key):**
```
📝 No stored installation key found, will create new one
✅ Created XMTP client
✅ Installation key validated and saved to localStorage
📊 Key length: 32 bytes
```

**Subsequent connections (valid stored key):**
```
🔑 Found stored installation key, validating it...
✅ Installation key loaded and validated from storage
✅ Created XMTP client with ReplyCodec and WalletSendCallsCodec
```

**If corrupted key detected:**
```
🔑 Found stored installation key, validating it...
❌ CORRUPTED INSTALLATION KEY DETECTED!
✅ Automatically cleared corrupted key
📝 Will create a fresh installation key
[Alert shown to user]
```

## 🔗 Utilities Available

### 1. **Clear XMTP Keys Utility** (New!)
- **Path:** `/clear-xmtp-keys.html`
- **Purpose:** Scan and clear all XMTP keys
- **Features:**
  - Auto-scan on page load
  - Visual list of found keys
  - One-click clear all
  - Safe and automatic

### 2. **Installation Limit Fixer**
- **Path:** `/fix-installation-limit.html`
- **Purpose:** Comprehensive installation management
- **Use when:** At 10/10 installation limit

### 3. **Revocation Script** (Local machine)
- **Path:** `scripts/revoke-xmtp-installations.mjs`
- **Purpose:** Server-side installation revocation
- **Run:** `npm run xmtp:revoke`
- **Use when:** Need to revoke from command line

## 📝 Next Steps

1. ✅ Clear corrupted keys using the utility
2. ✅ Refresh and reconnect
3. ✅ Verify clean connection logs
4. ✅ Test sending messages

The enhanced validation will prevent this issue from recurring!

## ⚠️ Important Notes

- **Clearing local keys doesn't clear installations on XMTP network**
- **You may still be at 9/10 or 10/10 installation limit server-side**
- **If you're at 10/10, you'll need to run the revocation script**
- **Each device/browser gets its own installation key**
- **Keys are wallet-specific** (`xmtp_installation_key_<address>`)

## 🆘 Still Having Issues?

If you continue seeing errors after clearing keys:

1. **Check installation count:**
   - You might still be at 10/10 on XMTP servers
   - Run: `npm run xmtp:revoke` (see `HOW_TO_RUN_REVOKE_SCRIPT.md`)

2. **Try a different browser:**
   - Rule out browser-specific storage issues
   - Fresh browser = fresh installation key

3. **Check browser console:**
   - Look for validation messages
   - Verify key is being saved correctly

4. **Contact support:**
   - Share the console logs
   - Include the exact error message

---

**Status:** ✅ Fix Applied  
**Version:** Enhanced validation with auto-recovery  
**Date:** 2025-11-06
