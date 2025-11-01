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
- **Privy:** Authentication service v2.0 (`@privy-io/react-auth@2.25.0`, `@privy-io/wagmi@1.0.6`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`, `@xmtp/content-type-reply`, `@xmtp/content-type-wallet-send-calls`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.
- **Farcaster Mini App SDK:** Base App/Farcaster integration (`@farcaster/miniapp-sdk`).

## Recent Updates

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