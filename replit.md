# Pocki Chat - Mindful AI Onchain Wallet Companion

## Overview
Pocki Chat is a Next.js 14 web application that functions as an AI wallet health agent via the XMTP messaging protocol. Its primary goal is to provide a secure, user-friendly chat interface for managing wallet health using Web3 technologies, primarily on the Base network. The project features a distinctive panda-themed design with a calming green and bamboo aesthetic. Pocki aims to be a mindful AI onchain wallet companion, assisting users with setting alerts, journaling trades, and making intentional decisions within the Base ecosystem.

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution

## System Architecture

### UI/UX Decisions
The application uses a panda-themed design with a calming green and bamboo aesthetic, implemented with Tailwind CSS. It features custom Pocki logos throughout the interface, including the landing page, chat header, and loading/error states, all styled with rounded corners and shadow effects. The UI is designed to be mobile-responsive, optimizing for various screen sizes.

### Technical Implementations
The application is built with Next.js 14 (App Router), React, and TypeScript.
- **Authentication:** Privy is used for secure wallet, email, and social logins.
- **Messaging:** XMTP Browser SDK (v5.0.1) facilitates real-time, secure messaging.
- **Web3:** Wagmi and Viem are used for Ethereum interactions, specifically targeting the Base network (chainId: 8453). RPC calls are configured with a fallback strategy for reliability.
- **State Management:** TanStack Query manages data fetching and caching.

### Feature Specifications
- **Authentication & Authorization:** Secure user authentication and protected routes.
- **XMTP Integration:** Includes XMTP client initialization with auto-reconnection, real-time message streaming, AI agent typing indicators, and robust conversation management to handle multiple or inactive conversations.
- **Message Management:** Displays message lists, offers manual refresh, and auto-syncs after sending messages to fetch AI responses. Supports various content types including text, reply, and transaction.
- **Transaction Handling:** Features a confirmation modal for executing transactions on the Base network, supporting multi-call transactions and 0x AllowanceHolder swaps with smart gas estimation and user guidance for token approvals.
- **User Feedback:** Utilizes a panda emoji for read status, loading skeletons, and animations. Accurate user/Pocki avatars are displayed.
- **Robustness:** Implements comprehensive error boundaries.
- **Farcaster Mini App Support:** The application functions as a mini app within Base App and Farcaster, while maintaining full standalone browser functionality.

### System Design Choices
- **Provider Hierarchy:** A layered structure of `PrivyProvider`, `QueryClientProvider`, `WagmiProvider`, and `XMTPProvider` ensures proper context.
- **XMTP Browser SDK v5.0.1:** Requires specific CORS headers, operates in a single tab due to OPFS limitations, and leverages WebAssembly.
- **Agent Interaction:** Communicates with an AI agent requiring specific XMTP Agent SDK configurations, including `ReplyCodec` registration and event listeners.
- **Deployment:** Optimized for Autoscale deployment on Replit, supporting WebSockets for XMTP streaming and optimized builds.

## External Dependencies
- **Privy:** Authentication service v1.99.1 (`@privy-io/react-auth@1.99.1`, `@privy-io/wagmi@0.2.13`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`, `@xmtp/content-type-reply`, `@xmtp/content-type-wallet-send-calls`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.
- **Farcaster Mini App SDK:** Base App/Farcaster integration (`@farcaster/miniapp-sdk`).

## Recent Updates

### Nov 2, 2025 - Privy SDK Rollback to v1.99.1
- **Rolled back from Privy v2.25.0 to v1.99.1** - Investigated v2/v3 upgrade but encountered blocking issues
  - **Investigation Summary:**
    - Attempted v3.5.0 migration to leverage improved useWallets ready state for Chrome/Android
    - v3.5.0 failed: JavaScript syntax errors from config incompatibility, initialization stuck at ready=false
    - Architect diagnosed: COOP header conflicts between XMTP (requires same-origin) and Privy v3 worker/iframe requirements
    - Attempted v2.25.0: Fixed config hydration errors, but Privy still stuck at ready=false
    - Root cause: Both v2/v3 have deeper incompatibilities with XMTP Browser SDK's strict COOP: same-origin requirement
  - **Solution:** Rolled back to last known working version (v1.99.1)
  - **Removed Features for v1.99.1 compatibility:**
    - Farcaster Mini App auto-login (`useLoginToMiniApp` not available in v1.99.1)
    - Users must manually click login button in Farcaster/Base App (acceptable tradeoff)
  - **Current Status:** App fully functional with Privy v1.99.1
  - **Known Limitations:**
    - Chrome/Android wallet detection timing issues remain (v1.99.1 limitation)
    - No automatic Farcaster authentication - manual login required
  - **Future Path:** Monitor Privy for COOP-compatible releases or XMTP for relaxed header requirements

### Nov 2, 2025 - Smart Wallet Detection for Base App Support
- **Implemented context-aware wallet detection** - Fixes Base App wallet timing issues without breaking Farcaster
  - Enhanced XMTP initialization with smart wallet type detection
  - Wallet priority: base_account > detected wallets > embedded wallet
  - Base App specific handling: Waits up to 2.5 seconds for base_account wallet to inject after auth
  - Browser extension handling: Waits up to 5 seconds for extension wallets to inject
  - Farcaster unchanged: Wallet already ready, proceeds immediately (preserves working flow)
  - Detailed logging shows which wallet type is being waited for and selection process
  - Solves Base App issue where XMTP signature request appeared before wallet was ready
  - **Testing Required:** Verify in The Base App that wallet connects before XMTP signature request

### Nov 2, 2025 - Farcaster Mini App Authentication Implementation
- **Implemented proper Farcaster Mini App authentication flow** - Follows Privy's official best practices
  - Added 'farcaster' to loginMethods in PrivyProvider configuration
  - Integrated `useLoginToMiniApp` hook from `@privy-io/react-auth/farcaster` on landing page
  - Implemented automatic Farcaster login flow using `miniappSdk.actions.signIn()`
  - Added `miniappSdk.actions.ready()` call when SDK loads for proper Mini App handshake
  - Authentication flow: Get nonce from Privy → Request signature from Farcaster → Authenticate with Privy
  - Removed 3-second XMTP initialization delay hack (no longer needed with proper auth timing)
  - Graceful fallback: Auto-login silently fails in standalone browser, manual login button still available
  - **Result:** Farcaster Mini App works perfectly ✅
  - COOP header remains `same-origin` (required for XMTP SharedArrayBuffer, incompatible with wallet popups)

### Nov 1, 2025 - Browser Extension Wallet Detection Fix
- **Fixed "No wallet" issue with desktop browser extensions** - Chrome with Rainbow/Coinbase extensions now works
  - Problem: Desktop browser extensions (Rainbow, Coinbase Wallet) inject wallets after Privy authentication completes, causing "No wallet" error and stuck "Connecting..." state
  - Root cause: Race condition where Privy says "ready" but wallets array is still empty because extensions inject providers asynchronously
  - Solution: Added retry logic in useXMTP hook
    - Polls for wallet availability up to 10 times with 500ms delays (5 seconds total)
    - Detailed debug logging shows wallet detection state and retry attempts
    - Removed `wallets.length > 0` requirement from useEffect trigger
    - Graceful fallback with clear error message after timeout
  - Mobile wallet browsers (Rainbow, Coinbase Wallet app) continue to work instantly as before
  - Desktop extensions now have 5 seconds to inject their wallet providers before timeout

### Nov 1, 2025 - Privy SDK v2.0 Migration
- **Migrated Privy SDK from 1.99.1 to 2.25.0** - Upgraded to stable v2 API with improved TypeScript support
  - Updated `@privy-io/react-auth` from 1.99.1 to 2.25.0
  - Updated `@privy-io/wagmi` from 0.2.13 to 1.0.6
  - Code already followed v2.0 patterns (embeddedWallets.createOnLogin, wagmi sendTransactionAsync)
  - No breaking changes required - existing implementation was v2-compatible
  - Fixed missing `styled-jsx` peer dependency for Next.js
  - Migration strategy: Staged approach (1.x → 2.0 complete, 2.0 → 3.0 deferred)
  - App runs successfully with Privy 2.0 authentication working correctly
  - Used `npm install --legacy-peer-deps` to handle peer dependency conflicts