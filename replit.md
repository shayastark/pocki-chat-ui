# Pocki Chat - AI Wallet Health Agent

## Project Overview
A Next.js 14 web application that allows users to chat with an AI wallet health agent using XMTP messaging protocol. Features panda-themed design with calm greens and bamboo accents.

## Current Status
**Project Structure:** ✅ Complete  
**Dependencies:** ✅ Installed  
**Configuration:** ✅ Complete
**Dev Server:** ✅ Running (Next.js 14.2.15)
**Privy Setup:** ✅ Complete (App ID configured)

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom panda/bamboo theme
- **Authentication:** Privy (@privy-io/react-auth, @privy-io/wagmi)
- **Messaging:** XMTP Browser SDK v5.0.1
- **Web3:** Wagmi, Viem for Base network (chainId: 8453)
- **State Management:** TanStack Query

## Architecture

### Provider Hierarchy
1. `PrivyProvider` - Wallet authentication (wallet, email, Google, Twitter)
2. `QueryClientProvider` - TanStack Query for data fetching
3. `WagmiProvider` - Ethereum interactions (Base network)
4. `XMTPProvider` - XMTP messaging client (custom context)

### Key Features Implemented
- ✅ Landing page with Privy authentication
- ✅ Protected chat route
- ✅ XMTP client initialization with auto-reconnection (up to 6 retries)
- ✅ **Automatic installation cleanup** - Auto-revokes old XMTP installations to prevent 10/10 limit
- ✅ Message list with real-time streaming
- ✅ Typing indicators from AI agent
- ✅ Panda emoji read status
- ✅ Transaction confirmation modal
- ✅ Transaction execution on Base network
- ✅ Comprehensive error boundaries
- ✅ Loading skeletons and animations

### File Structure
```
/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── chat/
│   │   └── page.tsx        # Chat interface (protected route)
│   ├── providers.tsx       # Provider configuration
│   └── globals.css         # Global styles & Tailwind
├── components/
│   ├── ErrorBoundary.tsx   # Error handling
│   ├── LoadingSpinner.tsx  # Loading states
│   ├── MessageList.tsx     # Chat message display
│   ├── MessageInput.tsx    # Send message input
│   └── TransactionModal.tsx # Transaction confirmation
├── hooks/
│   └── useXMTP.tsx         # XMTP client context & hooks
├── lib/
│   ├── wagmi-config.ts     # Wagmi configuration (Base)
│   └── constants.ts        # App constants
└── utils/                   # Utility functions

```

## Setup Required

### 1. Privy App ID
The user needs to provide their Privy App ID:
1. Go to https://dashboard.privy.io
2. Create a new app or use existing
3. Copy the App ID
4. Add to Replit Secrets: `NEXT_PUBLIC_PRIVY_APP_ID`

### 2. Environment Variables
Update `.env.local` with real values:
- `NEXT_PUBLIC_PRIVY_APP_ID` - From Privy dashboard
- `NEXT_PUBLIC_XMTP_ENV` - Set to 'production' for mainnet
- `NEXT_PUBLIC_AGENT_ADDRESS` - AI agent XMTP address

## XMTP Integration Notes

### Browser SDK v5.0.1 Considerations
- **CORS Headers Required:** Configured in `next.config.js`
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- **Single Tab Only:** OPFS limitation (Origin Private File System)
- **WebAssembly:** Uses WASM for performance
- **Auto-Reconnection:** Built-in stream auto-retry (6 retries with 10s delay)

### API Implementation (v5.0.1)
- Signer type: EOA (Externally Owned Account)
- Uses Privy wallet for signing
- **Conversation Syncing:**
  - `client.conversations.syncAll()` - Syncs all conversations AND messages (recommended)
  - `client.conversations.sync()` - Syncs only conversations (no messages)
  - ⚠️ Individual `conv.sync()` method removed in v5.0.1
- **DM Management:**
  - `getDmByInboxId(inboxId)` - Returns DM or `null` (doesn't throw error)
  - `newDm(inboxId)` - Creates new DM conversation
- Message streaming via `streamAllMessages()` callback pattern

## Design Theme
- **Mascot:** 🐼 Panda (calm, thoughtful, supportive)
- **Accent:** 🎋 Bamboo
- **Colors:** 
  - Panda Green: #16a34a (green-600) to #f0fdf4 (green-50)
  - Bamboo: #84cc16 (lime-600) to #f7fee7 (lime-50)
- **Animations:** Gentle, smooth (fade-in, slide-up, pulse-gentle)

## Recent Fixes (Oct 16, 2025)
1. **XMTP Browser SDK:** Fixed SWC compiler crash by making SDK load dynamically (`await import()` instead of static import)
2. **Next.js Version:** Successfully using Next.js 14.2.15 (v15 had Turbopack compatibility issues with Privy)
3. **Dev Server:** Working properly, compiles and serves pages successfully (21ms-6s response time)
4. **Webpack Optimization:** Simplified Next.js config to reduce compilation time and prevent chunk timeout errors
5. **Privy Integration:** App ID configured, but **REQUIRES DOMAIN WHITELIST** (see Known Issues below)

## Known Issues

### ✅ XMTP Browser SDK v4 Inbox ID - RESOLVED
**Previous Issue:** Cannot create new conversations with Ethereum addresses  
**Solution:** Now using agent's inbox ID instead of Ethereum address  
**Agent Inbox ID:** `046320945635c5a7b314bf268f77b0075fbf33599450615ea7f1a167d3ab4691`

The app now correctly uses `findOrCreateDm(inboxId)` to create conversations with the AI agent.

### Privy Domain Whitelist Required  
**Issue:** XMTP signature requests auto-rejected by Privy (CORS errors)
**Cause:** Preview domain cannot be whitelisted in Privy  
**Current Preview Domain:** `91fa36a8-073f-4d91-8728-918f26fb1525-00-3qehajd2olvp.spock.replit.dev`

**Solution:**
1. **Deploy the app** to get a stable deployment domain (e.g., `pocki-chat.replit.app`)
2. Go to [Privy Dashboard](https://dashboard.privy.io)
3. Select your app (ID: `cmgt1rxc7000qjr0do7m2hsvh`)
4. Navigate to Settings → Allowed domains
5. Add the **deployment domain** to the allowed list
6. Save changes

**Note:** These CORS errors are expected on preview domains and will resolve once deployed and whitelisted.

## Deployment Configuration

**Type:** Autoscale (optimal for this stateless Next.js web app)  
**Build:** `npm run build` (optimized for faster builds)
**Run:** `npm start` (uses PORT env variable in production)

**Build Optimizations:**
- Source maps disabled in production (speeds up builds)
- CSS optimization disabled (reduces build time)
- Deterministic module IDs for consistent builds

**Why Autoscale:**
- Stateless web UI (AI agent runs on separate reserved VM)
- Supports WebSocket for XMTP streaming
- Scales to zero when idle (cost-efficient)
- Can handle multiple instances and restarts

## Next Steps for User
1. **Deploy the app** to get a permanent domain (e.g., `pocki-chat.replit.app`)
2. **Whitelist deployment domain** in Privy Dashboard:
   - Go to [Privy Dashboard](https://dashboard.privy.io)
   - Select app (ID: `cmgt1rxc7000qjr0do7m2hsvh`)
   - Settings → Allowed domains
   - Add your deployment domain
3. **Test on deployed app:**
   - Click "Get Started with Privy"
   - Connect wallet/email/social login
   - Navigate to /chat
   - Chat with AI agent at 0xd003c8136e974da7317521ef5866c250f17ad155
4. **Test transactions** through chat to verify Base network integration

## Development Commands
```bash
npm run dev    # Start development server on port 5000
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run ESLint
```

## Recent Changes (Oct 17, 2025)
- **Upgraded to XMTP Browser SDK v5.0.1** - Latest version with bug fixes for duplicate welcome errors and unnecessary network requests
- **Fixed v5.0.1 compatibility issues:**
  - Removed deprecated `conv.sync()` call (method no longer exists in v5.0.1)
  - Added text message filtering to prevent React error #31 (filters out group membership changes and other non-text content)
  - **Added message syncing after send** - Syncs and re-fetches messages after sending to immediately show agent responses (with sync guard to prevent overlapping syncs)
- **Added conversation syncing** - Calls `syncAll()` to sync all conversations and messages
- **Fixed message sending error** - Now checks for existing DM before creating new one to prevent InboxValidationFailed errors
- **Fixed XMTP API method** - Changed from `findOrCreateDm()` to `newDm()` / `getDmByInboxId()` for XMTP Browser SDK v5
- **Fixed infinite signature loop** - Removed automatic retry logic that caused MetaMask to repeatedly ask for signatures
- Added initialization guard to prevent multiple simultaneous XMTP client creations
- Improved error handling for user-rejected signatures (no auto-retry)
- Updated to use agent's inbox ID (046320945635c5a7b314bf268f77b0075fbf33599450615ea7f1a167d3ab4691)
- Implemented automatic installation cleanup with `revokeAllOtherInstallations()`

## Previous Changes (Oct 16, 2025)
- Created full Next.js 14 application structure
- Installed all dependencies (@privy-io, @xmtp/browser-sdk, wagmi, viem)
- Configured CORS headers for XMTP Browser SDK
- Implemented all core components and features
- Set up provider hierarchy
- Created panda-themed UI with Tailwind
- Added comprehensive error handling and loading states

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution
