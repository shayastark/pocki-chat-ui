# Pocki Chat - AI Wallet Health Agent

## Overview
Pocki Chat is a Next.js 14 web application enabling users to interact with an AI wallet health agent via the XMTP messaging protocol. The project aims to provide a secure and intuitive chat interface for managing wallet health, leveraging Web3 technologies. Its design features a unique panda-themed aesthetic with calm greens and bamboo accents. The application offers robust authentication, real-time messaging, and on-chain transaction capabilities on the Base network, designed for a smooth user experience and efficient AI interaction.

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution

## System Architecture

### UI/UX Decisions
The application features a panda-themed design with calm green and bamboo accents, utilizing Tailwind CSS for styling. Animations are gentle and smooth, including fade-in, slide-up, and pulse effects.

### Technical Implementations
The core application is built with Next.js 14 (App Router), React, and TypeScript.
- **Authentication:** Privy is used for secure wallet, email, and social logins.
- **Messaging:** XMTP Browser SDK (v5.0.1) provides real-time, secure messaging.
- **Web3:** Wagmi and Viem are integrated for Ethereum interactions, specifically targeting the Base network (chainId: 8453).
- **State Management:** TanStack Query handles data fetching and caching.

### Feature Specifications
- **Authentication & Authorization:** Landing page with Privy authentication and protected chat routes.
- **XMTP Integration:** XMTP client initialization with auto-reconnection (up to 6 retries), automatic revocation of old XMTP installations to prevent limit issues, real-time message streaming, and typing indicators from the AI agent.
- **Message Management:** Message list display, manual refresh button for on-demand message syncing, and auto-sync after sending messages to fetch agent responses.
- **Transaction Handling:** Confirmation modal and execution of transactions on the Base network.
- **User Feedback:** Panda emoji read status, loading skeletons, and animations.
- **Robustness:** Comprehensive error boundaries are implemented throughout the application.

### System Design Choices
- **Provider Hierarchy:** `PrivyProvider` (authentication), `QueryClientProvider` (data fetching), `WagmiProvider` (Ethereum interactions), and `XMTPProvider` (messaging client) are nested to ensure proper context flow.
- **XMTP Browser SDK v5.0.1:** Requires specific CORS headers (`Cross-Origin-Embedder-Policy: credentialless`, `Cross-Origin-Opener-Policy: same-origin`), operates in a single tab due to OPFS limitations, and uses WebAssembly for performance.
- **Agent Interaction:** The application communicates with an AI agent that requires specific XMTP Agent SDK configurations, including `ReplyCodec` registration, event listeners for incoming text messages, and an actively running service with a matching inbox ID.
- **Deployment:** Optimized for Autoscale deployment on Replit, suitable for stateless web UI and supporting WebSockets for XMTP streaming. Builds are optimized with source maps and CSS optimization disabled for faster deployments.

## External Dependencies
- **Privy:** Authentication service (`@privy-io/react-auth`, `@privy-io/wagmi`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.

## Recent Changes (Oct 22, 2025)

### Critical Bugfix (Evening - Post UI Update)
- **Fixed Message Sending Failure** - Resolved "Failed to send message" error introduced by incomplete timestamp fix
  - Root cause: streamMessages handler wasn't converting timestamps to Date objects
  - Created inconsistency where initial/refreshed messages had Date objects but streamed messages had raw timestamps
  - Added missing `new Date()` conversion in streamMessages handler (line 380)
  - Messages now send successfully again

### UI Improvements
- **Pocki Logo Integration** - Replaced panda emojis with official Pocki logo throughout the app
  - Landing page now features large Pocki logo (160x160px) with rounded corners and shadow
  - Chat header displays medium Pocki logo (48x48px) for consistent branding
  - Message bubbles show small Pocki logo (32x32px) for agent messages
  - User messages display a gradient avatar with wallet address initials
  - Loading and error states updated with Pocki logo
  - Empty chat state features centered Pocki logo (120x120px)
- **Enhanced Visual Design** - Minor UI refinements while preserving simple clean theme
  - Changed read status indicator from panda emoji to checkmark (✓) for cleaner look
  - Added gradient background (green to bamboo) on landing page for depth
  - Improved avatar styling with rounded images and shadows
  - Enhanced loading screen with better spacing and typography
  - Refined color usage: emphasized panda-green over panda-bamboo for consistency
- **Fixed Invalid Date Bug** - Resolved timestamp formatting issue in messages
  - All `sentAt` timestamps now properly converted to Date objects using `new Date()`
  - Fixed optimistic UI updates to use consistent date format
  - Messages no longer show "Invalid Date" after being synced from XMTP
  - Applied fix to all message normalization points (initial load, refresh, stream)

### Previous Updates (Oct 18, 2025)
- Enhanced auto-sync timing (5s delay + 10s periodic background sync)
- Debug panel now hidden by default with toggle button
- Fixed consent state filtering for message delivery
- Changed CORS header to `credentialless` for XMTP compatibility
- Registered ReplyCodec during client creation
- Added optimistic UI updates and enhanced logging