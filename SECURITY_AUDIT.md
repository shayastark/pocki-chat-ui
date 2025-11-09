# Security Audit Report - API Key & Secret Exposure

**Date:** 2025-11-09  
**Status:** ✅ Secure (with fixes applied)

---

## Executive Summary

A comprehensive security scan was performed on the Pocki Chat codebase to identify any exposed API keys, secrets, or sensitive information that could be exploited in the browser environment. The audit found **one potential vulnerability** which has been **fixed**.

---

## Audit Findings

### 🔒 Critical: API Keys & Secrets

#### 1. NEYNAR_API_KEY - ✅ SECURE ✅

**Location:** 
- `lib/constants.ts`
- `lib/neynar.ts`

**Status:** ✅ **SAFE - Server-side only**

**Details:**
- NOT prefixed with `NEXT_PUBLIC_` (remains server-side)
- Only imported by `app/api/farcaster/profile/route.ts` (server-side API route)
- Never exposed to browser/client code
- Used to fetch Farcaster user profiles via Neynar API

**Verdict:** ✅ **Properly secured**

---

#### 2. Alchemy API Key - ⚠️ FIXED ⚠️

**Location:** `lib/wagmi-config.ts`

**Original Issue:**
```typescript
// BEFORE (INSECURE):
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
```

**Problem:** 
- Code checked for `NEXT_PUBLIC_ALCHEMY_API_KEY` first
- This would expose the API key in browser if set
- `wagmi-config.ts` is imported by client-side code (`providers.tsx`)

**Fix Applied:**
```typescript
// AFTER (SECURE):
// SECURITY: Never use NEXT_PUBLIC_ prefix for API keys - they get exposed to browser
const alchemyApiKey = process.env.ALCHEMY_API_KEY;
```

**Impact of Vulnerability (if exploited):**
- Attackers could extract Alchemy API key from browser console
- Key could be used to make unauthorized RPC calls
- Rate limits could be exhausted
- Potential cost implications if on paid plan

**Verdict:** ✅ **FIXED - No longer vulnerable**

---

#### 3. Privy App IDs - ✅ INTENTIONALLY PUBLIC ✅

**Location:**
- `lib/constants.ts`
- `app/providers.tsx`

**Environment Variables:**
```bash
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID=...
```

**Status:** ✅ **SAFE - Designed to be public**

**Details:**
- These are **client identifiers**, not secret keys
- Privy's authentication flow requires them to be public
- They identify your app to Privy's auth service
- No security risk - this is the correct implementation

**Analogy:** Like a username (public) vs password (secret)

**Verdict:** ✅ **Correct implementation**

---

#### 4. Agent Wallet Addresses - ✅ PUBLIC BY DESIGN ✅

**Location:** `lib/constants.ts`

```typescript
export const AGENT_WALLET_ADDRESS = '0xd003c8136e974da7317521ef5866c250f17ad155';
```

**Status:** ✅ **SAFE - Public by design**

**Details:**
- This is a wallet address (pocki.base.eth) that receives XMTP messages
- Wallet addresses are public by nature on blockchain
- Anyone can send messages to this address (intended behavior)
- No sensitive information exposed

**Verdict:** ✅ **Correct implementation**

---

## Environment Variable Guidelines

### ✅ SAFE to use `NEXT_PUBLIC_` prefix:

These are **intentionally exposed** to the browser:

```bash
# Client-side authentication identifiers
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID=...

# Public configuration
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_AGENT_ADDRESS=...
NEXT_PUBLIC_AGENT_BASENAME=pocki.base.eth

# Public URLs
NEXT_PUBLIC_DOMAIN=https://chat.pocki.app
```

---

### ⛔ NEVER use `NEXT_PUBLIC_` prefix:

These should **remain server-side only**:

```bash
# API Keys (NEVER expose these!)
NEYNAR_API_KEY=...
ALCHEMY_API_KEY=...

# Private keys or secrets
DATABASE_URL=...
SESSION_SECRET=...
ENCRYPTION_KEY=...

# Authentication secrets
PRIVY_APP_SECRET=...  # if you have one
JWT_SECRET=...
```

---

## Next.js Security Model

### How `NEXT_PUBLIC_` Works

In Next.js, environment variables are handled differently based on their prefix:

#### Server-side Only (NO prefix):
```typescript
// ✅ SAFE: Only accessible in server-side code
const apiKey = process.env.NEYNAR_API_KEY;
```
- Only available in:
  - API routes (`app/api/**/route.ts`)
  - Server components
  - Server actions
  - Build-time scripts
- **Never** sent to browser
- **Never** visible in client-side code

#### Client-side (NEXT_PUBLIC_ prefix):
```typescript
// ⚠️ PUBLIC: Exposed to browser
const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
```
- Bundled into client JavaScript
- Visible in browser DevTools
- Can be extracted by anyone
- Use **only** for public configuration

---

## Security Checklist

Use this checklist to verify your environment variables:

### For Each Environment Variable:

- [ ] Is this value sensitive (API key, secret, password)?
  - ✅ YES → Do NOT use `NEXT_PUBLIC_` prefix
  - ❌ NO → Can use `NEXT_PUBLIC_` if needed client-side

- [ ] Does this need to be accessed in browser/client code?
  - ✅ YES → Must use `NEXT_PUBLIC_` prefix (ensure it's not sensitive!)
  - ❌ NO → Do NOT use `NEXT_PUBLIC_` prefix

- [ ] Could this value be abused if public?
  - ✅ YES → NEVER use `NEXT_PUBLIC_` prefix
  - ❌ NO → Safe to expose

---

## Testing for Exposure

### How to verify secrets aren't exposed:

1. **Build your app:**
   ```bash
   npm run build
   ```

2. **Check the built files:**
   ```bash
   grep -r "your-api-key" .next/
   ```

3. **Inspect browser console:**
   - Open DevTools → Console
   - Type: `process.env`
   - Verify sensitive keys are NOT visible

4. **Check network tab:**
   - Open DevTools → Network
   - Verify API keys aren't in request headers/bodies from client

---

## Common Mistakes to Avoid

### ❌ DON'T:

```typescript
// WRONG: Exposing API key to browser
const apiKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;

// WRONG: Hardcoding secrets
const secret = "sk_live_abc123...";

// WRONG: Logging secrets
console.log('API Key:', apiKey);

// WRONG: Passing server env vars to client components
// server component
export default function Page() {
  const apiKey = process.env.SECRET_KEY;
  return <ClientComponent secret={apiKey} />; // DON'T!
}
```

### ✅ DO:

```typescript
// CORRECT: Keep API keys server-side
// app/api/stripe/route.ts
const apiKey = process.env.STRIPE_SECRET_KEY; // No NEXT_PUBLIC_

// CORRECT: Use client IDs (not secrets) on client
const publicId = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// CORRECT: Call APIs from server
// app/api/user/route.ts
export async function GET() {
  const apiKey = process.env.NEYNAR_API_KEY;
  const data = await fetch('https://api.neynar.com/...', {
    headers: { 'x-api-key': apiKey }
  });
  return Response.json(data);
}
```

---

## Deployment Security

### Railway/Vercel/Production:

1. **Set environment variables in platform dashboard**
   - Railway: Project Settings → Variables
   - Vercel: Project Settings → Environment Variables

2. **Never commit `.env` files to git**
   ```bash
   # .gitignore should contain:
   .env
   .env.local
   .env*.local
   ```

3. **Use different values for production vs development**
   - Development: Test API keys
   - Production: Production API keys with rate limits

4. **Rotate keys regularly**
   - Set calendar reminder to rotate API keys quarterly
   - Revoke old keys after rotation

5. **Monitor usage**
   - Check Alchemy dashboard for unusual traffic
   - Check Neynar usage for rate limit hits
   - Set up alerts for API usage spikes

---

## Current Security Status

### ✅ All Clear

After applying the fixes in this audit:

✅ No API keys exposed to browser  
✅ Proper separation of server/client env vars  
✅ No hardcoded secrets in codebase  
✅ Good fallback RPC endpoints (don't rely on single provider)  
✅ Environment variables properly documented  

---

## Recommendations

### Immediate Actions (Completed ✅):
- ✅ Fixed Alchemy API key exposure in `wagmi-config.ts`
- ✅ Updated `.env.example` with security notes
- ✅ Documented proper environment variable usage

### Best Practices Going Forward:

1. **Before adding any new environment variable:**
   - Ask: "Is this sensitive?"
   - Ask: "Does the browser need it?"
   - Use checklist above

2. **Code review checklist:**
   - [ ] No `NEXT_PUBLIC_` prefix on API keys
   - [ ] No hardcoded secrets
   - [ ] API calls from server-side code only
   - [ ] No secrets logged to console

3. **Regular audits:**
   - Run this scan quarterly
   - Check `.next/` build output for leaked secrets
   - Review environment variables when onboarding new services

---

## Additional Resources

- [Next.js Environment Variables Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Privy Security Best Practices](https://docs.privy.io/guide/security)

---

## Contact

For security concerns or questions:
- Review this document
- Check `.env.example` for proper variable naming
- Verify server vs client usage in Next.js docs

**Remember:** When in doubt, keep it server-side! 🔒
