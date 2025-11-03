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