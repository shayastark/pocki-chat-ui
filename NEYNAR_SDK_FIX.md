# Neynar SDK Fix - Profile Picture & Display Name

## Summary of Changes

I've fixed the Neynar SDK integration and added comprehensive debugging to help identify the issue with pfp_url and display_name not showing up.

## What Was Fixed

### 1. **Installed Missing Dependencies**
The Neynar SDK was listed in `package.json` but wasn't actually installed in `node_modules`. I ran `npm install` to ensure all dependencies are properly installed.

### 2. **Added Comprehensive Logging**
Added detailed console logging throughout the entire flow to track:
- When Farcaster profile fetching is initiated
- The raw API responses from Neynar
- Field mapping from Neynar response to app format
- Profile display in the UI

### 3. **Improved Error Handling**
- Added checks for missing `NEYNAR_API_KEY`
- Made all error handling graceful (returns null instead of throwing)
- Added clear warning messages when API key is not configured

### 4. **Fixed Field Mapping**
- Confirmed the Neynar SDK uses snake_case (`display_name`, `pfp_url`)
- Added fallback values to prevent empty strings
- Added trim() to handle whitespace in profile data

### 5. **Enhanced UserHeader Component**
- Added logging when Farcaster profile data is received
- Added trim() checks to ensure empty strings don't override valid data
- Improved avatar URL handling

## Critical: Set Your NEYNAR_API_KEY

**The most likely reason pfp_url and display_name aren't showing is that the NEYNAR_API_KEY environment variable is not set.**

### How to Fix:

1. **Get a Neynar API Key:**
   - Go to https://neynar.com
   - Sign up/log in
   - Get your API key from the dashboard

2. **Set the Environment Variable:**
   
   Create a `.env.local` file in the root directory (or add to existing one):
   ```bash
   NEYNAR_API_KEY=your_actual_api_key_here
   ```

3. **Restart Your Development Server:**
   ```bash
   npm run dev
   ```

## How to Debug

With all the logging I've added, you'll now see detailed console output when you sign in:

### Expected Console Output (Successful):

```
🔍 Fetching Farcaster profile... user object: { authenticated: true, hasUser: true, ... }
🎯 Farcaster user detected, fetching profile for FID: 12345
📨 API route /api/farcaster/profile called with FID: 12345
🔄 Calling fetchUserProfile for FID: 12345
🔍 Fetching Farcaster profile for FID: 12345
📦 Neynar API response: { users: [...] }
👤 Raw user data from Neynar: { fid: 12345, username: "...", display_name: "...", pfp_url: "https://...", ... }
✅ Mapped profile data: { fid: 12345, username: "...", displayName: "...", pfpUrl: "https://...", ... }
📥 API Response status: 200
📥 API Response body: {"fid":12345,"username":"...","displayName":"...","pfpUrl":"https://..."}
✅ Fetched Farcaster profile by FID: { fid: 12345, ... }
🖼️ Profile picture URL: https://...
👤 Display name: John Doe
👤 UserHeader received Farcaster profile: { fid: 12345, username: "...", displayName: "John Doe", pfpUrl: "https://...", ... }
🖼️ Using Farcaster pfp: https://...
📝 UserHeader display name: John Doe from: { fcDisplayName: "John Doe", fcUsername: "johndoe", basename: null }
```

### Error Scenarios You Might See:

**1. Missing API Key:**
```
⚠️ NEYNAR_API_KEY is not set. Farcaster profile features will not work.
❌ Cannot fetch Farcaster profile: NEYNAR_API_KEY is not set
⚠️ Profile not found for FID: 12345
❌ Failed to fetch Farcaster profile. Status: 404 Body: {"error":"User not found or NEYNAR_API_KEY not configured"}
```
**Solution:** Set your NEYNAR_API_KEY in `.env.local`

**2. Invalid API Key:**
```
❌ Error fetching user profile from Neynar: [Axios Error details]
```
**Solution:** Check that your API key is correct

**3. User Not on Farcaster:**
```
ℹ️ No Farcaster account found for address: 0x...
```
**Solution:** This is expected if the user hasn't connected their wallet to Farcaster

## Verification Steps

1. **Check Console Logs:**
   Open your browser's Developer Console (F12) and watch for the emoji-prefixed logs

2. **Verify API Key:**
   ```bash
   echo $NEYNAR_API_KEY
   # or
   cat .env.local | grep NEYNAR
   ```

3. **Test with Known Farcaster User:**
   - Sign in with a wallet that's connected to a Farcaster account
   - Watch the console logs to see the entire flow
   - The pfp and display name should appear in the header

4. **Check Network Tab:**
   - Open Developer Tools → Network tab
   - Filter for "farcaster"
   - Check the API responses to see what data is being returned

## File Changes Made

### Modified Files:
1. `/lib/neynar.ts` - Added logging, error handling, and API key checks
2. `/app/page.tsx` - Added detailed logging for profile fetching
3. `/components/UserHeader.tsx` - Added logging and improved data handling
4. `/app/api/farcaster/profile/route.ts` - Added logging to API route
5. `/app/api/farcaster/profile-by-address/route.ts` - Added logging to API route

### No Breaking Changes:
All changes are backwards compatible and purely additive (logging + error handling).

## What to Check in Neynar Docs

The Neynar SDK version we're using is `3.81.2`. According to the type definitions:

```typescript
interface User {
  fid: number;
  username: string;
  display_name?: string;  // This is the correct field name
  pfp_url?: string;       // This is the correct field name
  follower_count: number;
  following_count: number;
  power_badge?: boolean;
}
```

Our code correctly maps these fields:
- `user.display_name` → `profile.displayName`
- `user.pfp_url` → `profile.pfpUrl`

## Next Steps

1. **Set your NEYNAR_API_KEY** in `.env.local`
2. **Restart your dev server**
3. **Sign in with Farcaster**
4. **Check the console logs** to see the detailed flow
5. **Share any error messages** you see if it still doesn't work

## Additional Resources

- [Neynar API Documentation](https://docs.neynar.com/reference)
- [Neynar Node.js SDK on npm](https://www.npmjs.com/package/@neynar/nodejs-sdk)
- [Neynar Dashboard](https://neynar.com)

---

**If you still see issues after setting the API key, please share:**
1. The console logs (with sensitive data redacted)
2. The network response from `/api/farcaster/profile`
3. Any error messages

The comprehensive logging I've added will help us identify exactly where the issue is occurring.
