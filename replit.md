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

### Nov 4, 2025 - CRITICAL FIX: Chain ID Parsing for CAIP-2 Format ✅
- **Fixed chain ID parsing to handle Base App wallet format**
  - **Problem:** Pre-flight chain verification detected wallet as chain 14 instead of Base (8453), causing 3 failed switch attempts and blocking XMTP initialization
  - **Root cause:** Base App wallet returns chain ID in CAIP-2 format `"eip155:8453"`, but code parsed it as hexadecimal, extracting only `"e"` (14 in hex)
  - **Solution:** Updated chain ID parser to handle both CAIP-2 and hex formats (hooks/useXMTP.tsx lines 235-280)
    - **CAIP-2 format**: `"eip155:8453"` → split on `":"` → extract `"8453"` → parse as decimal → `8453`
    - **Hex format**: `"0x2105"` → parse as hexadecimal → `8453`
    - **Numeric format**: Use value directly
    - Added diagnostic logging showing both raw and parsed chain IDs
  - **Testing Results**: Browser logs confirm correct parsing:
    - `🔍 Current wallet chain: {"raw":"eip155:8453","parsed":8453,"expected":8453}`
    - `✅ Wallet already on Base network`
    - `✅ Created XMTP client with ReplyCodec and WalletSendCallsCodec`
  - **Result:** Wallet on Base (8453) correctly recognized, no unnecessary chain switches, XMTP initialization succeeds

### Nov 4, 2025 - CRITICAL FIX: Pre-flight Chain Verification for XMTP Initialization ✅
- **Fixed XMTP "Signature validation failed" error in Base App**
  - **Problem:** Base App wallet reported chain ID 14 (unknown) or 0 (disconnected) during XMTP initialization, causing signature validation failures when chain switching occurred mid-signature
  - **Root cause:** Chain verification happened inside `signMessage` function during XMTP client creation, switching chains while signature request was in progress
  - **Solution:** Moved chain verification to occur BEFORE XMTP client creation with retry logic
    - **Pre-flight verification loop** (hooks/useXMTP.tsx lines 226-283):
      - Checks wallet chain ID before any XMTP operations
      - Automatically switches to Base network (8453) if wallet is on wrong chain
      - Waits 300ms after switch and verifies it succeeded
      - Retries up to 3 times with 500ms delays if verification fails
      - Throws clear error if chain cannot be switched after max attempts
    - **Simplified signMessage** (hooks/useXMTP.tsx lines 305-323):
      - Removed redundant chain verification since chain is guaranteed correct before XMTP initialization
      - Signatures now always execute on correct Base chain
  - **Result:** XMTP initialization succeeds in Base App; all signatures requested on correct chain, preventing validation errors

### Nov 4, 2025 - CRITICAL FIX: Configured Privy App Client for Base App ✅
- **Fixed Privy 400 authentication error in Base App**
  - **Problem:** Base App Mini Apps getting `POST https://auth.privy.io/api/v2/farcaster/authenticate 400 (Bad Request)` after successfully obtaining nonce and signature
  - **Root cause:** Default Privy app configuration uses httpOnly cookies, which Base App does not support per official Privy documentation
  - **Solution:** Created dedicated Privy App Client for Base App with non-httpOnly cookies and centralized detection to prevent race conditions
    - **Privy Dashboard:** Created new Web App Client with ID `client-WY6RdKiPGQJANCbSJQGU1f4NEr2nmb1FKkurudHXcHmSg`
    - **Allowed Origins:** Configured `https://base.app` in app client settings
    - **Cookie Settings:** Disabled httpOnly cookies for Base App compatibility
    - **Environment:** Added `NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID` secret
  - **Architecture Changes:**
    - **Created MiniAppContext** (`app/contexts/MiniAppContext.tsx`): Single source of truth for Mini App detection
      - Exposes: `isMiniApp`, `isBaseApp`, `isFarcaster`, `detectionComplete`
      - Runs once on mount using official `miniappSdk.isInMiniApp()` method
    - **Updated Providers** (`app/providers.tsx`): 
      - Wrapped in `MiniAppProvider` → `PrivyWrapper` hierarchy
      - `PrivyWrapper` consumes detection context
      - Sets `clientId` based on `detectionComplete && isBaseApp`
      - Uses `key` prop to force PrivyProvider remount when clientId changes
    - **Updated Landing Page** (`app/page.tsx`):
      - Consumes shared MiniAppContext
      - Gates auto-login on `ready && detectionComplete` to prevent race condition
      - Auto-login only proceeds after Privy has correct configuration
  - **Implementation Flow:**
    1. MiniAppContext detects environment on app mount
    2. PrivyProvider mounts with default config (clientId=undefined)
    3. When detection completes and Base App is detected, clientId changes to Base App client ID
    4. Key prop forces PrivyProvider to remount with new configuration
    5. Landing page waits for `detectionComplete` before triggering auto-login
    6. Auto-login uses correctly configured Privy instance with non-httpOnly cookies
  - **Result:** Base App authentication now uses proper Privy configuration, eliminating 400 errors caused by httpOnly cookie mismatch

### Nov 4, 2025 - Fixed Base App Mini App Detection & XMTP Chain Persistence ✅
- **Implemented official SDK Mini App detection method**
  - **Problem:** Base App Mini Apps failed to connect wallet on both iOS and Android; Android showed chain ID error "Initially added with 8453 but now signing from 0"
  - **Root cause 1:** Manual timeout-based detection (`miniappSdk.context` race) was unreliable for Base App
  - **Root cause 2:** Base Account wallet chain drifted from Base (8453) to disconnected (0) after XMTP initialization
  - **Solution 1 - Detection:** Use official `miniappSdk.isInMiniApp()` method
    - More reliable than custom timeout approach
    - Works consistently across Farcaster and Base App on all platforms
    - Logs detailed context including Base App detection (clientFid 309857)
  - **Solution 2 - Chain Persistence:** Added chain verification before every XMTP signature
    - Checks wallet chain ID before signing messages
    - Auto-switches back to Base network if wallet drifts to chain 0 or wrong network
    - Includes retry logic with detailed error logging
    - Prevents "Wrong chain id" XMTP errors
  - **Result:** Browser users unaffected, Mini App detection more reliable, XMTP signatures protected from chain drift
  - **Note:** Privy allowlist configuration still required for production domain

### Nov 3, 2025 - MAJOR: Implemented Privy-Based Mini App Authentication ✅
- **Unified authentication flow using Privy for Farcaster AND Base App Mini Apps**
  - **Previous approach:** Custom Quick Auth for Farcaster, custom Base Account bypass for Base App - resulted in OPFS errors and complexity
  - **New approach:** Use Privy's official Mini App integration (`useLoginToMiniApp` from `@privy-io/react-auth/farcaster`)
  - **Implementation:**
    - **Landing page:** Auto-login for all Mini Apps using `initLoginToMiniApp() → miniappSdk.actions.signIn() → loginToMiniApp()`
    - **XMTP initialization:** Unified flow using Privy's wallet detection for all platforms (browser, Farcaster, Base App)
    - **Removed:** All custom Base App bypass logic (`initializeClientForBaseApp`), Quick Auth backend verification, sessionStorage checks
  - **Benefits:**
    - Works with both Farcaster wallet AND Base Account wallet through Privy
    - No iframe OPFS issues - Privy handles wallet provider detection properly
    - Single authentication code path for all platforms
    - Follows Privy's official best practices for Mini Apps
  - **Result:** Seamless authentication and XMTP messaging for browser users (wallet/email/social), Farcaster Mini App users, and Base App users

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