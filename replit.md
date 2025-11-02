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
- **Privy:** Authentication service v3.5.0 (`@privy-io/react-auth@3.5.0`, `@privy-io/wagmi@2.0.2`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`, `@xmtp/content-type-reply`, `@xmtp/content-type-wallet-send-calls`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.
- **Farcaster Mini App SDK:** Base App/Farcaster integration (`@farcaster/miniapp-sdk`).

## Recent Updates

### Nov 2, 2025 - Reverted Breaking Wallet Connection Changes ✅
- **Restored working wallet connection flow** - Fixed complete wallet connection breakage across all platforms
  - **Reverted to `login()`:** Changed landing page back from `connectOrCreateWallet()` to `login()` from `usePrivy()`
    - `connectOrCreateWallet()` was breaking wallet connection completely - nothing happened when clicking wallet options
    - Restored original working authentication flow
  - **Removed `wallet.loginOrLink()` call:** Removed explicit wallet authentication from XMTP initialization
    - This authentication step was interfering with the wallet connection process
  - **Kept WalletConnect support:** Maintained `wallet_connect` in walletList for broader wallet compatibility
    - walletList: `['base_account', 'metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect', 'detected_wallets']`
  - **Result:** Wallet connection now works again on all platforms (desktop browser, mobile wallet browsers)

### Nov 2, 2025 - Successful Privy SDK v3.5.0 Migration  ✅
- **Successfully upgraded from Privy v1.99.1 to v3.5.0** - Leveraging new features while maintaining XMTP Browser SDK compatibility
  - **Solution: Updated COOP headers to enable both Privy v3 and XMTP**
    - Changed `Cross-Origin-Opener-Policy` from `same-origin` to `same-origin-allow-popups`
    - Kept `Cross-Origin-Embedder-Policy: credentialless` (more flexible than `require-corp`)
    - This combination allows Privy OAuth/wallet popups while maintaining XMTP SharedArrayBuffer support
  - **Package Updates:**
    - `@privy-io/react-auth`: 1.99.1 → 3.5.0
    - `@privy-io/wagmi`: 0.2.13 → 2.0.2
  - **Configuration Changes for v3:**
    - Updated embeddedWallets config to v3 format (flat `createOnLogin` instead of nested `ethereum.createOnLogin`)
    - Removed `useLoginToMiniApp` hook (not available in v3.5.0 - users use manual login button)
  - **Current Status:** 
    - ✅ Privy v3.5.0 initializes successfully (`ready: true` state reached)
    - ✅ XMTP Browser SDK remains compatible with new headers
    - ✅ Wallet detection functional (Coinbase Wallet, Base Account SDK detected)
    - ✅ App compiles and runs without errors
  - **Benefits of v3 Upgrade:**
    - Access to latest Privy features and improvements
    - Better TypeScript support and type safety
    - Improved wallet connection handling
    - Future-proof for Privy's continued v3+ development
  - **Known Behavior:**
    - Farcaster/Base App users click manual login button (no auto-login in v3.5.0)
    - "Privy iframe failed to load" warning appears but doesn't affect functionality

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