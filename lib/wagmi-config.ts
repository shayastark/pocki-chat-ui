import { createConfig } from '@privy-io/wagmi';
import { base } from 'viem/chains';
import { http, fallback } from 'viem';

// Construct Alchemy RPC URL from environment variable
// Note: In Next.js client-side code, we need NEXT_PUBLIC_ prefix
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
const alchemyRpcUrl = alchemyApiKey 
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  : null;

// Debug logging
console.log('🔧 Wagmi Config:', {
  hasAlchemyKey: !!alchemyApiKey,
  alchemyConfigured: !!alchemyRpcUrl,
  usingAlchemy: !!alchemyRpcUrl,
});

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: fallback(
      [
        // Primary: Alchemy (if API key is configured)
        ...(alchemyRpcUrl ? [http(alchemyRpcUrl)] : []),
        // Fallbacks: Free public endpoints
        http('https://base.drpc.org'),
        http('https://rpc.ankr.com/base'),
        http('https://mainnet.base.org'),
      ]
    ),
  },
});
