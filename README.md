# Pocki Chat UI

Frontend web application for the Pocki Agent, an AI trading companion that helps users trade mindfully and strategically on Base.

**Live Application:** [https://chat.pocki.app](https://chat.pocki.app)  
**Main Website:** [https://pocki.app](https://pocki.app)

## Overview

Pocki Chat is a Next.js application that provides a chat interface for interacting with the Pocki Agent via XMTP messaging. The agent helps users with portfolio analysis, trading decisions, setting guardrails, and monitoring wallet health.

## Features

- **Authentication** - Wallet, email, Google, and Twitter login via Privy
- **XMTP Messaging** - Secure, decentralized messaging with the Pocki Agent
- **Transaction Execution** - Execute trades and swaps directly from the chat interface
- **Portfolio Analysis** - Real-time wallet and portfolio insights
- **Alerts & Guardrails** - Set trading limits, cooldown periods, and price alerts
- **Multi-Chain Support** - Base network integration with support for other chains
- **Mini App Support** - Works as a Farcaster and Base App Mini App

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Privy** - Wallet authentication
- **XMTP Browser SDK** - Decentralized messaging
- **Wagmi** - Ethereum interactions
- **Viem** - Ethereum utilities
- **TanStack Query** - Data fetching and caching

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Privy App ID ([https://dashboard.privy.io](https://dashboard.privy.io))

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID=your_base_app_client_id
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key
```

### Development

```bash
npm run dev
```

The application will be available at [http://localhost:5000](http://localhost:5000).

### Build

```bash
npm run build
npm start
```

## Architecture

### Provider Hierarchy

1. **ThemeProvider** - Dark/light mode theming
2. **ToastProvider** - Toast notifications
3. **MiniAppProvider** - Farcaster/Base App detection
4. **PrivyProvider** - Authentication and wallet management
5. **QueryClientProvider** - TanStack Query for data fetching
6. **WagmiProvider** - Ethereum wallet interactions
7. **XMTPProvider** - XMTP messaging client

### Key Components

- **Landing Page** (`app/page.tsx`) - Authentication and app introduction
- **Chat Interface** - XMTP messaging with the Pocki Agent
- **MessageList** - Display conversation history
- **MessageInput** - Send messages to the agent
- **TransactionModal** - Confirm and execute blockchain transactions
- **UserHeader** - User profile and logout

### XMTP Integration

The application uses the XMTP Browser SDK for secure, end-to-end encrypted messaging with the Pocki Agent. Features include:

- Real-time message streaming
- Automatic reconnection logic
- Typing indicators
- Message history synchronization

## Deployment

The application is deployed on Railway. The build process uses Nixpacks and runs `npm run build` before starting the production server.

## Security

- All wallet operations use Privy + Wagmi
- XMTP messages are end-to-end encrypted
- Transaction confirmations required before execution
- Content Security Policy (CSP) configured for secure resource loading
- Environment variables for sensitive configuration

## License

MIT
