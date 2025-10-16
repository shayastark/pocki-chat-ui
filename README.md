# 🐼 Pocki Chat - AI Wallet Health Agent

A Next.js 14 web application for chatting with an AI wallet health agent using XMTP messaging protocol.

## Features

- 🔐 **Privy Authentication** - Support for wallet, email, Google, and Twitter login
- 💬 **XMTP Messaging** - Secure, decentralized messaging with AI agent
- 🔄 **Auto-Reconnection** - Automatic retry logic for dropped XMTP connections
- 🐼 **Panda Read Status** - Message read indicators with panda emoji
- ⌨️ **Typing Indicators** - See when the AI agent is typing
- 🔗 **Base Network** - Transaction execution on Base (chainId: 8453)
- 🎨 **Panda Theme** - Calm, bamboo-inspired design

## Getting Started

### Prerequisites

- Node.js 20 or higher
- A Privy App ID (get one at [https://dashboard.privy.io](https://dashboard.privy.io))

### Environment Setup

1. Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

2. Add your Privy App ID to `.env.local`:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_AGENT_ADDRESS=0xd003c8136e974da7317521ef5866c250f17ad155
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Privy** - Wallet authentication
- **XMTP Browser SDK** - Decentralized messaging
- **Wagmi** - Ethereum interactions
- **Viem** - Ethereum utilities
- **TanStack Query** - Data fetching and caching

## Architecture

### Provider Hierarchy

1. **PrivyProvider** - Authentication and wallet management
2. **QueryClientProvider** - TanStack Query for data fetching
3. **WagmiProvider** - Ethereum wallet interactions
4. **XMTPProvider** - XMTP messaging client

### Key Components

- **Landing Page** (`/`) - Authentication and app introduction
- **Chat Interface** (`/chat`) - Protected route with XMTP messaging
- **MessageList** - Display conversation history with auto-scroll
- **MessageInput** - Send messages to AI agent
- **TransactionModal** - Confirm and execute blockchain transactions
- **ErrorBoundary** - Comprehensive error handling

### XMTP Integration

The app uses the XMTP Browser SDK (v4.0.0) with:

- Automatic reconnection logic (up to 6 retries with exponential backoff)
- Message streaming with real-time updates
- Typing indicators from AI agent
- Read status tracking

**Important:** XMTP Browser SDK requires specific CORS headers (configured in `next.config.js`):
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

## Transaction Handling

The app supports:

- ETH transfers on Base network
- ERC-20 token approvals
- Token swaps
- Transaction confirmation modals
- Receipt display with transaction status

## Design Theme

- **Mascot:** 🐼 Panda (calm, thoughtful, supportive)
- **Accent:** 🎋 Bamboo
- **Colors:** Soft greens, blacks, whites
- **Animations:** Gentle, smooth transitions

## Security Notes

- All wallet operations use Privy + Wagmi
- XMTP messages are end-to-end encrypted
- Transaction confirmations required before execution
- Environment variables for sensitive configuration

## Troubleshooting

### XMTP Connection Issues

If you experience connection issues:
1. Check that CORS headers are configured in `next.config.js`
2. Verify your wallet is connected via Privy
3. Try refreshing the page (auto-reconnect will retry)

### Single Tab Limitation

The XMTP Browser SDK uses OPFS (Origin Private File System) which only supports single-tab usage. Opening multiple tabs may cause connection issues.

## License

MIT
