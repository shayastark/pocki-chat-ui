# Pocki Chat - Mindful AI Onchain Wallet Companion

## Overview
Pocki Chat is a Next.js 14 web application providing an AI wallet health agent via the XMTP messaging protocol. Its core purpose is to offer a secure, intuitive chat interface for managing wallet health using Web3 technologies, primarily on the Base network. The project features a unique panda-themed design with calm greens and bamboo accents, aiming for a smooth user experience, efficient AI interaction, and robust on-chain transaction capabilities. Pocki envisions itself as a mindful AI onchain wallet companion, helping users set alerts, journal trades, and make intentional decisions on the Base network.

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution

## System Architecture

### UI/UX Decisions
The application employs a panda-themed design with a calming green and bamboo aesthetic, implemented using Tailwind CSS. It features custom Pocki logos throughout the interface, including the landing page, chat header, and loading/error states, all styled with rounded corners and shadow effects.

### Technical Implementations
The application is built with Next.js 14 (App Router), React, and TypeScript.
- **Authentication:** Privy enables secure wallet, email, and social logins.
- **Messaging:** XMTP Browser SDK (v5.0.1) facilitates real-time, secure messaging.
- **Web3:** Wagmi and Viem are used for Ethereum interactions, specifically targeting the Base network (chainId: 8453).
- **State Management:** TanStack Query manages data fetching and caching.

### Feature Specifications
- **Authentication & Authorization:** Secure user authentication and protected routes.
- **XMTP Integration:** Includes XMTP client initialization with auto-reconnection, automatic revocation of old XMTP installations, real-time message streaming, and AI agent typing indicators.
- **Message Management:** Displays message lists, offers manual refresh, and auto-syncs after sending messages to fetch AI responses.
- **Transaction Handling:** Features a confirmation modal for executing transactions on the Base network, supporting multi-call transactions and 0x AllowanceHolder swaps with user guidance.
- **User Feedback:** Utilizes a panda emoji for read status, loading skeletons, and animations.
- **Robustness:** Implements comprehensive error boundaries.

### System Design Choices
- **Provider Hierarchy:** A layered structure of `PrivyProvider`, `QueryClientProvider`, `WagmiProvider`, and `XMTPProvider` ensures proper context.
- **XMTP Browser SDK v5.0.1:** Requires specific CORS headers, operates in a single tab due to OPFS limitations, and leverages WebAssembly.
- **Agent Interaction:** Communicates with an AI agent requiring specific XMTP Agent SDK configurations, including `ReplyCodec` registration and event listeners.
- **Deployment:** Optimized for Autoscale deployment on Replit, supporting WebSockets for XMTP streaming and optimized builds.

## External Dependencies
- **Privy:** Authentication service (`@privy-io/react-auth`, `@privy-io/wagmi`).
- **XMTP:** Decentralized messaging protocol (`@xmtp/xmtp-js`, `@xmtp/browser-sdk`, `@xmtp/content-type-reply`, `@xmtp/content-type-wallet-send-calls`).
- **Wagmi:** React Hooks for Ethereum (`wagmi`).
- **Viem:** TypeScript interface for Ethereum (`viem`).
- **TanStack Query:** Data fetching library (`@tanstack/react-query`).
- **Next.js:** Web framework.
- **Tailwind CSS:** Utility-first CSS framework.

## Recent Updates

### Oct 25, 2025 - Avatar Fix & Mobile-Responsive UI
- **Fixed user/Pocki avatar identification** - User messages now correctly show 🎋 bamboo emoji
  - Fixed `isOwnMessage` logic to compare XMTP inbox IDs instead of wallet addresses
  - User messages now display 🎋 (bamboo) avatar, Pocki messages display 🐼 (panda) avatar
  - Used `debugInfo.clientInboxId` from XMTP context for proper message ownership detection
- **Made chat UI mobile-responsive** - Optimized for phones and tablets
  - Responsive header: smaller logo on mobile, condensed button text, icon-only layout on small screens
  - Responsive message bubbles: adjusted padding, font sizes, and max-width for mobile (85% width on mobile, 75% on desktop)
  - Responsive message input: smaller touch targets, icon-only send button on mobile
  - Responsive debug panel: smaller fonts, better text wrapping, horizontal scroll for long addresses
  - Mobile-first Tailwind breakpoints (sm:, md:, lg:) used throughout for adaptive layouts
  - Transaction cards optimized with break-all for long amounts and smaller text on mobile

### Oct 25, 2025 - Force Sync Conversation Refresh Fix
- **Fixed "message failed to send" error after Force Sync All Conversations** - Prevents stale conversation reference errors
  - Root cause: `forceSyncAll()` synced data but didn't refresh the active conversation object
  - After sync, conversation object became stale and message sending failed with server-side error
  - Solution: Added conversation refresh logic to `forceSyncAll()` using `getDmByInboxId()`
  - Now refreshes conversation object and peer inbox ID after syncing
  - Loads messages directly from refreshed conversation to avoid closure stale reference issue
  - Handles all content types (text, reply, transaction) with proper timestamp normalization
  - Stream automatically re-establishes when conversation object updates via React useEffect
  - Fixes issue where debug panel shows "multiple conversations detected" and then messages fail to send

### Oct 25, 2025 - Real-Time Reply Message Support
- **Added reply content type handling to message stream** - Pocki's responses now appear instantly without manual refresh
  - Installed `@xmtp/content-type-reply` package for proper reply detection
  - Added `ContentTypeReply` import to stream handler alongside `ContentTypeWalletSendCalls`
  - Implemented reply message detection using XMTP recommended `.sameAs()` method
  - Extracts text from nested `message.content.content` structure with fallback to `contentFallback`
  - Stream now handles three content types: transactions, replies, and plain text
  - No rate limiting impact since stream uses persistent WebSocket connection (no additional API calls)
  - Users see agent responses immediately without clicking manual refresh button