# Neynar Integration for Farcaster User Profiles

This document explains the Neynar integration implemented to fetch and display Farcaster user profiles in Pocki chat.

## Overview

When a Farcaster Mini App user signs in to Pocki chat, we now automatically fetch their username, profile picture, and other profile data from Neynar and display it in the UI.

## Implementation Details

### 1. Dependencies

**Installed Package:**
```json
"@neynar/nodejs-sdk": "latest"
```

### 2. Environment Variables

**Required Configuration:**
```bash
NEYNAR_API_KEY=your_neynar_api_key_here
```

Get your API key from: https://neynar.com

### 3. New Files Created

#### `/lib/neynar.ts`
Utility module for Neynar API integration:
- `getNeynarClient()`: Singleton client instance
- `fetchUserProfile(fid)`: Fetches user profile data by FID

#### `/app/api/farcaster/profile/route.ts`
API endpoint to fetch Farcaster profiles:
- **Endpoint**: `GET /api/farcaster/profile?fid={fid}`
- **Response**: User profile data (username, display name, pfp URL, badges, etc.)

### 4. Modified Files

#### `/lib/constants.ts`
- Added `NEYNAR_API_KEY` constant

#### `/app/contexts/MiniAppContext.tsx`
- Added `FarcasterProfile` interface
- Added `farcasterProfile` state and `setFarcasterProfile` function
- Extended context to store Farcaster user data

#### `/app/page.tsx`
- Added `useEffect` hook in `ChatContent` component to fetch Farcaster profile on authentication
- Checks if user authenticated with Farcaster via Privy
- Fetches profile data using the user's FID
- Stores profile in context

#### `/components/UserHeader.tsx`
- Updated to display Farcaster profile data when available
- Priority order for display:
  1. Farcaster display name
  2. Farcaster username
  3. Basename
  4. Truncated wallet address
- Shows Farcaster profile picture if available
- Displays power badge emoji (⚡) for users with Farcaster power badge
- Shows `@username` in subtitle for Farcaster users

#### `.env.example`
- Added Neynar configuration section with `NEYNAR_API_KEY`

## How It Works

### Authentication Flow

1. User signs in to Pocki chat using Farcaster (via Privy)
2. Once authenticated, the app checks if the user has a linked Farcaster account
3. If yes, it extracts the FID (Farcaster ID) from Privy's user object
4. The app calls the Neynar API via `/api/farcaster/profile?fid={fid}`
5. Profile data is fetched and stored in the MiniAppContext
6. The UserHeader component reactively updates to show:
   - Farcaster profile picture
   - Display name or username
   - Power badge (if applicable)
   - @username in the subtitle

### UI Display Priority

The `UserHeader` component now displays user information in this priority order:

**Avatar:**
1. Farcaster profile picture (pfpUrl)
2. Basename avatar
3. Generated identicon (from wallet address)

**Display Name:**
1. Farcaster display name (e.g., "Dan Romero")
2. Farcaster username (e.g., "dwr.eth")
3. Basename (e.g., "myname.base.eth")
4. Truncated wallet address (e.g., "0x1234...5678")

**Subtitle:**
- For Farcaster users: Shows `@username`
- For Basename users: Shows truncated wallet address
- Otherwise: Hidden

## Example Response from Neynar

```json
{
  "fid": 3,
  "username": "dwr.eth",
  "displayName": "Dan Romero",
  "pfpUrl": "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bc698287-5adc-4cc5-a503-de16963ed900/original",
  "followerCount": 489109,
  "followingCount": 3485,
  "powerBadge": true
}
```

## Testing

To test the integration:

1. Set your `NEYNAR_API_KEY` in `.env.local`
2. Sign in to Pocki using Farcaster authentication
3. Your Farcaster profile picture and username should appear in the header
4. If you have a power badge, you'll see ⚡ next to your name

## Benefits

- **Better User Experience**: Users see their familiar Farcaster identity
- **Social Proof**: Power badges and profile data increase trust
- **Consistency**: Matches the user's identity across Farcaster ecosystem
- **Fallback Support**: Gracefully falls back to Basename or wallet address if Farcaster data is unavailable

## Future Enhancements

Potential improvements:
- Display follower/following counts
- Show Farcaster bio in user profile
- Add verified addresses display
- Cache profile data to reduce API calls
- Support profile updates/refreshing
