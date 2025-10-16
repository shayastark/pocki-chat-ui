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
- **Messaging:** XMTP Browser SDK v4.0.0
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

### Browser SDK v4.0.0 Considerations
- **CORS Headers Required:** Configured in `next.config.js`
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- **Single Tab Only:** OPFS limitation (Origin Private File System)
- **WebAssembly:** Uses WASM for performance
- **Auto-Reconnection:** 6 retries with 10s delay on stream failures

### API Implementation
- Signer type: EOA (Externally Owned Account)
- Uses Privy wallet for signing
- DM conversations via `client.conversations.findOrCreateDm()`
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
3. **Dev Server:** Working properly, compiles and serves pages successfully
4. **Privy Integration:** App ID configured via Replit Secrets, authentication ready

## Next Steps for User
1. **Test Authentication:** Click "Get Started with Privy" to connect wallet/email/social login
2. **Chat with AI Agent:** After auth, navigate to /chat to start XMTP messaging
3. **Test Transactions:** Send transaction requests through chat to test Base network integration
4. **Deploy:** When ready, configure deployment settings and publish the app

## Development Commands
```bash
npm run dev    # Start development server on port 5000
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run ESLint
```

## Recent Changes (Oct 16, 2025)
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
