# Pocki Chat - Mindful AI Onchain Wallet Companion

## Overview
Pocki Chat is a Next.js 14 web application designed as an AI wallet health agent utilizing the XMTP messaging protocol. It offers a secure, intuitive chat interface for managing wallet health on the Base network. The project features a unique panda-themed design with calm greens and bamboo accents, aiming for a smooth user experience, efficient AI interaction, and robust on-chain transaction capabilities. Pocki's vision is to be a mindful AI onchain wallet companion, assisting users with alerts, trade journaling, and intentional decision-making on the Base network.

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution

## System Architecture

### UI/UX Decisions
The application features a panda-themed design with a calming green and bamboo aesthetic, implemented using Tailwind CSS. Custom Pocki logos are used throughout the interface, styled with rounded corners and shadow effects. The UI is mobile-responsive, optimizing for various screen sizes.

### Technical Implementations
The application is built with Next.js 14 (App Router), React, and TypeScript.
- **Authentication:** Privy is used for secure wallet, email, and social logins, including Sign-In With Farcaster (SIWF) for mini-app contexts.
- **Messaging:** XMTP Browser SDK (v5.0.1) facilitates real-time, secure messaging, including handling various content types like replies and wallet send calls.
- **Web3:** Wagmi and Viem are used for Ethereum interactions, specifically targeting the Base network (chainId: 8453), with robust RPC fallback strategies for reliable transactions.
- **State Management:** TanStack Query manages data fetching and caching.

### Feature Specifications
- **Authentication & Authorization:** Secure user authentication and protected routes, with conditional flows for standalone and Farcaster mini-app contexts.
- **XMTP Integration:** Includes XMTP client initialization with auto-reconnection, real-time message streaming, AI agent typing indicators, and robust conversation management to prevent "inactive group" errors.
- **Message Management:** Displays message lists, offers manual refresh, auto-syncs after sending messages, and supports real-time display of AI responses.
- **Transaction Handling:** Features a confirmation modal for executing transactions on the Base network, supporting multi-call transactions and 0x AllowanceHolder swaps with intelligent gas estimation and user guidance.
- **User Feedback:** Utilizes a panda emoji for read status, loading skeletons, and animations. Typing indicators accurately reflect AI processing time.
- **Robustness:** Implements comprehensive error boundaries and intelligent conversation selection logic to handle duplicate XMTP conversations.

### System Design Choices
- **Provider Hierarchy:** A layered structure of `PrivyProvider`, `QueryClientProvider`, `WagmiProvider`, and `XMTPProvider` ensures proper context management.
- **XMTP Browser SDK v5.0.1:** Requires specific CORS headers, operates in a single tab, and leverages WebAssembly. Agent interaction requires specific XMTP Agent SDK configurations.
- **Deployment:** Optimized for Autoscale deployment on Replit, supporting WebSockets for XMTP streaming and optimized builds.
- **Farcaster Mini App Integration:** Designed to run seamlessly as a mini app within Base App and Farcaster, with conditional UI rendering and authentication flows.

## External Dependencies
- **Privy:** Authentication service (`@privy-io/react-auth`, `@privy-io/wagmi`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`, `@xmtp/content-type-reply`, `@xmtp/content-type-wallet-send-calls`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.
- **Farcaster Mini App SDK:** Base App/Farcaster integration (`@farcaster/miniapp-sdk`).