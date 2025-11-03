# Pocki Chat - Mindful AI Onchain Wallet Companion

## Overview
Pocki Chat is a Next.js 14 web application acting as an AI wallet health agent via the XMTP messaging protocol. It offers a secure, user-friendly chat interface for managing wallet health on the Base network. Pocki aims to be a mindful AI onchain wallet companion, helping users set alerts, journal trades, and make intentional decisions within the Base ecosystem. The project features a distinctive panda-themed design with a calming green and bamboo aesthetic.

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution

## System Architecture

### UI/UX Decisions
The application features a panda-themed design with a calming green and bamboo aesthetic, implemented using Tailwind CSS. It incorporates custom Pocki logos with rounded corners and shadow effects. The UI is designed to be mobile-responsive.

### Technical Implementations
The application is built with Next.js 14 (App Router), React, and TypeScript.
- **Authentication:** Dual authentication using Quick Auth for Farcaster/Base App Mini Apps with JWT verification, and Privy (v3.5.0) for standalone browser users (wallet, email, social logins).
- **Messaging:** XMTP Browser SDK (v5.0.1) provides real-time, secure messaging.
- **Web3:** Wagmi and Viem are utilized for Ethereum interactions, specifically targeting the Base network (chainId: 8453), with a fallback RPC strategy.
- **State Management:** TanStack Query handles data fetching and caching.

### Feature Specifications
- **Authentication & Authorization:** Secure user authentication and protected routes.
- **XMTP Integration:** Includes XMTP client initialization, real-time message streaming, AI agent typing indicators, and robust conversation management.
- **Message Management:** Displays message lists, offers manual refresh, and auto-syncs for AI responses. Supports text, reply, and transaction content types.
- **Transaction Handling:** Features a confirmation modal for Base network transactions, supporting multi-call transactions and 0x AllowanceHolder swaps with gas estimation and token approval guidance.
- **User Feedback:** Utilizes a panda emoji for read status, loading skeletons, and animations, along with accurate user/Pocki avatars.
- **Robustness:** Implements comprehensive error boundaries.
- **Farcaster Mini App Support:** Functions as a mini app within Base App and Farcaster, while maintaining full standalone browser functionality.

### System Design Choices
- **Provider Hierarchy:** A layered structure of `PrivyProvider`, `QueryClientProvider`, `WagmiProvider`, and `XMTPProvider` ensures proper context.
- **XMTP Browser SDK v5.0.1:** Requires specific CORS headers, operates in a single tab due to OPFS limitations, and leverages WebAssembly.
- **Agent Interaction:** Communicates with an AI agent requiring specific XMTP Agent SDK configurations, including `ReplyCodec` registration and event listeners.
- **Deployment:** Optimized for Autoscale deployment on Replit, supporting WebSockets for XMTP streaming and optimized builds.

## External Dependencies
- **Quick Auth:** Farcaster authentication service (`@farcaster/quick-auth`).
- **Privy:** Authentication service v3.5.0 (`@privy-io/react-auth`, `@privy-io/wagmi`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`, `@xmtp/content-type-reply`, `@xmtp/content-type-wallet-send-calls`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.
- **Farcaster Mini App SDK:** Base App/Farcaster integration (`@farcaster/miniapp-sdk`).

## Recent Updates

### Nov 3, 2025 - FIXED: Removed Incorrect eth_requestAccounts Call for Base App ✅
- **Base App provides already-connected wallet - no connection request needed**
  - **Root cause:** Was incorrectly calling `eth_requestAccounts` which triggered Face ID prompt that auto-dismissed
  - **Misunderstanding:** Base App (and Farcaster) provide in-app wallets that are already connected - no external wallet connection needed
  - **Fix implemented:** 
    - Removed `eth_requestAccounts` call entirely from `initializeClientForBaseApp()`
    - Removed 3-second delay added for Face ID (not needed)
    - Now uses `eth_accounts` directly to get the already-connected Base App wallet address
  - **Expected behavior:** No Face ID prompt - XMTP initializes using Base App's connected wallet seamlessly
  - **Status:** Testing whether OPFS Database(NotFound) issue persists or if this resolves it

### Nov 3, 2025 - Fixed Base App 400 Error & XMTP Wallet Detection ✅
- **Fixed Base App Quick Auth 400 Bad Request error AND wallet detection**
  - **Problem 1:** Base App users got 400 Bad Request when Quick Auth tried to verify SIWF message at `https://auth.farcaster.xyz/verify-siwf`
  - **Problem 2:** After skipping Quick Auth, Privy couldn't detect the Base Account wallet, blocking XMTP initialization
  - **Root cause:** Base App auto-connects users to Base Account on launch. Both Quick Auth and Privy are unnecessary - Base Account provides its own authentication and wallet
  - **Solution:** Complete Base App integration bypassing Privy entirely
    - **Landing page:** Detect Base App using SDK context (`clientFid === 309857`), skip Quick Auth, auto-navigate to chat
    - **XMTP hook:** Created `initializeClientForBaseApp()` function that:
      - Gets wallet provider directly from Mini App SDK (`sdk.wallet.ethProvider`)
      - Creates viem wallet client from Base Account provider
      - Initializes XMTP with Base Account signer (no Privy needed)
    - **Authentication routing:** Chat page recognizes 3 auth methods via sessionStorage:
      - `quickAuthToken` for Farcaster Mini App
      - `baseAppConnected` for Base App
      - Privy `authenticated` for browsers
  - **Result:** Base App users get seamless Base Account wallet detection and XMTP messaging

### Nov 3, 2025 - Fixed Mini App Redirect Loop ✅
- **Fixed chat page redirect loop for Mini App users**
  - **Problem:** After Quick Auth succeeded and navigated to `/chat`, the chat page immediately redirected back to `/` because it only checked for Privy authentication, creating an infinite navigation loop
  - **Root cause:** Chat page authentication guard used useEffect to check Quick Auth token asynchronously, so on first render `hasQuickAuth` was `false` and redirect fired before token was detected
  - **Solution:** Initialize Quick Auth state synchronously using useState initializer
    - Changed from `useEffect` checking sessionStorage (async state update) to `useState(() => sessionStorage.getItem())` (sync initialization)
    - Updated redirect logic to accept EITHER Privy auth OR Quick Auth token
    - Ensures `hasQuickAuth` has correct value on first render before redirect logic runs
  - **Result:** Mini App users with Quick Auth token now successfully stay on chat page

### Nov 3, 2025 - Fixed Chrome Desktop Ready State Deadlock ✅
- **Fixed Privy useWallets() ready: false deadlock**
  - **Problem:** Chrome Desktop showed `authenticated: true` with 2 wallets detected, but `ready: false` permanently, blocking XMTP initialization
  - **Root cause:** Privy's `ready` flag sometimes stays false even when wallets are already available
  - **Solution:** Bypass ready check when wallets exist
    - Updated both `initializeClient()` and useEffect trigger: `isAuthenticated && (ready || hasWallets)`
    - XMTP initialization proceeds when authenticated users have wallets, regardless of Privy's ready state
  - **Result:** Chrome Desktop browser users can now use the app with extension wallets

### Nov 2, 2025 - Implemented Dual Authentication Strategy ✅
- **Added Quick Auth for Farcaster/Base App Mini Apps**
  - Uses `@farcaster/quick-auth` SDK with JWT verification on backend `/api/auth` route
  - Quick Auth token stored in sessionStorage for session persistence
  - No Privy login() call for Mini Apps - native wallet detected via Privy's useWallets() without authentication
- **Maintained Privy authentication for browsers**
  - Full wallet, email, and social login support for standalone web users