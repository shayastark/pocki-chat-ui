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
- **Farcaster Mini App SDK:** Base App/Farcaster integration (`@farcaster/miniapp-sdk`).

## Recent Updates

### Oct 31, 2025 - Farcaster/Base App Mini App Integration
- **Added Farcaster Mini App support** - Pocki Chat now runs as a mini app in Base App and Farcaster while maintaining full standalone browser functionality
  - Installed `@farcaster/miniapp-sdk` package for mini app integration
  - Created Farcaster manifest at `/public/.well-known/farcaster.json` with:
    - App metadata (name, description, category, domain)
    - Image assets (icon 1024x1024, splash 200x200, hero/OG 1200x630)
    - accountAssociation fields (empty until post-deployment setup via Base Build tool)
  - Added `fc:miniapp` embed metadata to `app/layout.tsx` for rich social previews when shared
  - Implemented SDK initialization in chat page:
    - Calls `sdk.actions.ready()` on mount to hide mini app splash screen
    - Detects mini app context using `sdk.isInMiniApp()` for conditional rendering
    - Logs context (mini app vs standalone) for debugging
    - Includes defensive fallback to call `ready()` even if detection fails
  - Updated BaseAppBanner to conditionally hide when running as mini app (users already in Base App)
  - App architecture supports both contexts:
    - Standalone browser: Full authentication flow, visible banner, regular links
    - Mini app: Base Account authentication, hidden banner, optimized UX
  - **Removed "Clear XMTP Database" button** - Nuclear option that deleted all user data including journal entries
    - Users can recover from stuck states using Force Sync and Fix Conversation buttons
    - Both Farcaster and Base App provide native "Refresh" options in their 3-dot menus
    - Prevents accidental loss of valuable conversation history and journal data
  - Next steps: After deployment, generate accountAssociation credentials using Base Build tool and update manifest

### Oct 29, 2025 - XMTP Inactive Group Fix
- **Fixed "Group is inactive" error preventing messages to Pocki** - Chat now works reliably in our UI
  - Problem: Users saw "Unable to send a message on an inactive group" error when sending messages to Pocki, even though chat worked in Base app
  - Root cause: XMTP Browser SDK v5 requires conversations to be synced before use, otherwise they become "inactive"
  - Solution: Added conversation sync calls at critical points
    - Sync conversation during initialization after selection/creation
    - Sync conversation before every message send
    - Check `isActive()` status and throw clear error if inactive
  - Per XMTP v5 docs, `conversation.sync()` pulls latest state from network and ensures conversation is ready for messages
  - Minimal performance impact - sync is fast and only happens on send (not on receive)
  - Users can now reliably send messages to Pocki without "inactive group" errors

### Oct 29, 2025 - Previously-Used Wallet Fix  
- **Fixed "Errors Occurred During Sync" preventing previously-used wallets from signing in**
  - Problem: Wallets that had been used before would fail initialization with "Group is inactive" error
  - Root cause: Syncing inactive conversations and then trying to sync them individually caused errors
  - Solution: Removed problematic sync calls during initialization
    - Removed auto-revocation of old installations (caused "Unknown signer" errors)
    - Removed conversation.sync() during initialization (caused "Group is inactive" on stale conversations)
    - Keep only the sync before sending messages (where it's actually needed)
  - Previously-used wallets now work just like new wallets
  - Users can manually clear XMTP data by clearing browser storage if needed

### Oct 27, 2025 - Swap Transaction Reliability Fix
- **Fixed swap transactions failing with "internal error" in Pocki Chat** - Swaps now work as reliably as in Base app
  - Problem: Transactions to 0x AllowanceHolder would fail with "transaction likely to fail" or "internal error from 0xA2Eae..." 
  - Root cause: Using `custom(window.ethereum)` routed all transactions through MetaMask's default RPC, which can have rate limits and reliability issues with complex AllowanceHolder swaps
  - Solution: Switched to HTTP transports with fallback strategy
    - Now uses Base's official RPC (https://mainnet.base.org) as primary
    - Fallback to drpc.org and ankr.com for redundancy
    - Alchemy RPC prioritized if API key is available
  - HTTP transports provide better retry logic, faster propagation, and handle complex multi-call transactions reliably
  - Users will now see swap transactions succeed consistently, matching Base app experience

### Oct 27, 2025 - Multiple Conversations Fix
- **Fixed broken chat caused by duplicate XMTP conversations** - Chat now works reliably after republishing
  - Problem: XMTP could create multiple conversations with Pocki, causing messages to go to the wrong conversation
  - Root cause: Conversations are stored on XMTP network, not locally - clearing database didn't fix duplicates
  - Solution: Smart conversation selection logic
    - Detects when multiple conversations with Pocki exist
    - Automatically chooses the conversation with the most messages (the active one)
    - Uses that specific conversation instead of random duplicate
  - Clear logging shows which conversation was selected and why
  - Fixes issue for all users going forward, even after republishing or clearing local storage

### Oct 26, 2025 - Gas Estimate Fix for 0x Swaps
- **Fixed inflated gas estimates for 0x AllowanceHolder transactions** - No more huge gas fees shown in MetaMask
  - Problem: Wagmi's automatic gas estimation would simulate the transaction, fail if token wasn't approved, and show inflated gas estimates as safety measure
  - Solution: Smart gas estimation with fallback strategy
    - First attempts automatic gas estimation
    - If estimation fails (missing approval), falls back to conservative 1.5M gas limit
    - If estimation succeeds (approved), uses accurate estimated amount
  - 1.5M fallback safely handles complex multi-hop swaps and permit2 flows
  - Transactions now show reasonable gas estimates even when token approval is pending
  - AllowanceHolder address: `0x0000000000001ff3684f28c67538d4d072c22734`
  - Warning message still shown to guide users through token approval process

### Oct 26, 2025 - Typing Indicator Timing Fix
- **Fixed typing indicator to show while Pocki is thinking** - Three-bubble animation now appears for full duration of AI response time
  - Previously: Typing indicator appeared briefly AFTER Pocki's response arrived (backwards logic)
  - Now: Typing indicator turns ON when user sends message, turns OFF when Pocki's response arrives
  - Changed `sendMessage()` to set `isAgentTyping = true` immediately after sending
  - Changed stream handler to set `isAgentTyping = false` when agent message is received
  - Users now see accurate "Pocki is thinking..." state during entire wait time (can be several seconds)

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