import { createConfig } from '@privy-io/wagmi';
import { base } from 'viem/chains';
import { http, fallback } from 'viem';

// Construct Alchemy RPC URL from environment variable
// SECURITY: Never use NEXT_PUBLIC_ prefix for API keys - they get exposed to browser
const alchemyApiKey = process.env.ALCHEMY_API_KEY;
const alchemyRpcUrl = alchemyApiKey 
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  : null;

// Debug logging
console.log('🔧 Wagmi Config:', {
  hasAlchemyRPC: !!alchemyRpcUrl,
  usingFallbackTransports: true,
});

// Always use HTTP transports for better reliability with complex transactions
// MetaMask's custom provider can cause issues with 0x AllowanceHolder swaps
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: fallback([
      ...(alchemyRpcUrl ? [http(alchemyRpcUrl)] : []),
      http('https://mainnet.base.org'), // Base's official RPC (most reliable)
      http('https://base.drpc.org'),
      http('https://rpc.ankr.com/base'),
    ]),
  },
});
