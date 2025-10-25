# Pocki Chat - Mindful AI Onchain Wallet Companion

## Overview
Pocki Chat is a Next.js 14 web application enabling users to interact with an AI wallet health agent via the XMTP messaging protocol. Pocki is your Mindful AI Onchain Wallet Companion. The project aims to provide a secure and intuitive chat interface for managing wallet health, leveraging Web3 technologies. Its design features a unique panda-themed aesthetic with calm greens and bamboo accents. The application offers robust authentication, real-time messaging, and on-chain transaction capabilities on the Base network, designed for a smooth user experience and efficient AI interaction.

## User Preferences
- Prefers comprehensive implementations with all requested features
- Wants auto-reconnection, typing indicators, and transaction handling
- Requires panda emoji for read status
- Needs confirmation modals before transaction execution

## System Architecture

### UI/UX Decisions
The application features a panda-themed design with calm green and bamboo accents, utilizing Tailwind CSS for styling. Animations are gentle and smooth, including fade-in, slide-up, and pulse effects.

**Branding:**
- **Logo:** Custom Pocki logo image (`/public/pocki-logo.jpg`) featuring a panda holding a wallet on a green background
- **Logo Usage:** Used throughout the app including landing page, chat header, loading states, and error states
- **Logo Styling:** Rounded corners with shadow effects for a modern, friendly appearance

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

## Recent Updates

### Oct 25, 2025 - RPC Rate Limit Fix
- **Fixed "Request is being rate limited" error during transaction execution** - Transactions now execute reliably
  - Root cause: wagmi was using viem's default public RPC endpoint which has strict rate limits
  - Solution: Configured fallback RPC transports in wagmi config with Alchemy as primary endpoint
  - Uses Alchemy (`ALCHEMY_API_KEY` secret) as primary with 300M compute units/month and high rate limits
  - Falls back to DRPC, Ankr, and Base official RPC endpoints if Alchemy is unavailable
  - Multi-call transactions (approve + swap) no longer hit rate limits during execution
  - Fallback configuration ensures high availability and automatic retry on rate limit errors

### Oct 24, 2025 - CRITICAL FIX: Transaction Message Detection
- **Fixed wallet swap transactions not working** - Transaction approval requests now appear correctly
  - Root cause: Code was checking `contentType.typeId` string instead of using XMTP recommended `.sameAs()` method
  - Solution: Import `ContentTypeWalletSendCalls` and use `message.contentType.sameAs(ContentTypeWalletSendCalls)` for detection
  - Updated both streaming and refresh message handlers to use proper XMTP content type comparison
  - Fixes "Filtering out unknown message type: walletSendCalls" console error
  - Transaction requests from Pocki AI now properly trigger the Execute Transaction modal

### Oct 24, 2025 - Landing Page Description Update
- **Updated "What is Pocki?" section** - Refreshed landing page description text
  - New description: "Pocki is your mindful AI onchain wallet companion. Like a wise panda who never rushes, Pocki helps you set alerts, journal your trades, and pause before acting on impulse. Trade with intention on Base."
  - Better emphasizes mindfulness, specific features (alerts, journaling), and Base network focus

### Oct 24, 2025 - Debug Tools Enhancement
- **Added Clear XMTP Database tool** - New debug panel feature to fix stuck XMTP states
  - Button to clear all XMTP IndexedDB databases and reload the page
  - Helps resolve stuck Intent errors and installation conflicts
  - Provides confirmation dialog to warn users before clearing data

### Oct 23, 2025 - XMTP Sync Improvements
- **Enhanced conversation sync strategy** - Improved reliability for message delivery
  - Added post-revocation sync: After revoking old installations, immediately syncs all conversations
  - Added conversation-specific sync: When getting existing conversations, syncs to ensure current group state
  - Fixes inbox validation errors caused by stale group membership data

### Oct 23, 2025 - XMTP Transaction Support (WalletSendCalls)
- **Implemented XMTP WalletSendCalls content type** - Full support for on-chain transaction requests from Pocki AI agent
  - Installed and integrated `@xmtp/content-type-wallet-send-calls` package
  - Registered `WalletSendCallsCodec` alongside `ReplyCodec` in XMTP client initialization
  - Updated message handlers to detect and parse transaction messages in both streaming and refresh flows
  - Extended Message interface with `contentType` field ('text' | 'transaction') and `transaction` field for payload
  - Enhanced MessageList component to display transaction requests with visual indicators and "Execute Transaction" button
  - Completely rewrote TransactionModal to support XMTP multi-call format:
    - Sequential execution of multiple calls (e.g., approve + swap flows)
    - Uses `sendTransactionAsync` and `waitForTransactionReceipt` for proper async confirmation
    - Validates `from` address matches connected wallet before execution
    - Validates chain ID (Base network: 8453) before execution
    - Per-call status tracking with distinct UI states: "Signing...", "Confirming...", "✅ Confirmed"
    - Detects and surfaces reverted transactions as errors
    - Graceful error handling with per-call error messages
    - Only shows success banner when all calls are confirmed on-chain
  - Maintains backward compatibility with legacy transaction format
  - Full support for transaction metadata (description, type, amount, currency)

### Oct 23, 2025 - Pocki Logo Branding
- **Added custom Pocki logo** - Replaced panda emoji (🐼) with custom Pocki logo image throughout the app
  - Created `/public` folder and added `pocki-logo.jpg` (panda holding wallet on green background)
  - Updated landing page hero section with 200x200px logo with rounded corners and shadow
  - Updated chat page header with 48x48px logo
  - Updated loading states with 120-150px logo
  - Updated error states with 120px logo
  - All logo instances use Next.js Image component for performance optimization
  - Logo styling includes rounded corners for visual consistency with panda-themed design