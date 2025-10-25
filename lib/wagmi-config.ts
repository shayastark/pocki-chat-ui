import { createConfig } from '@privy-io/wagmi';
import { base } from 'viem/chains';
import { http, fallback } from 'viem';

// Construct Alchemy RPC URL from environment variable
const alchemyApiKey = process.env.ALCHEMY_API_KEY;
const alchemyRpcUrl = alchemyApiKey 
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  : null;

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
