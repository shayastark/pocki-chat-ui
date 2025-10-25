import { createConfig } from '@privy-io/wagmi';
import { base } from 'viem/chains';
import { http, fallback, custom } from 'viem';

// Construct Alchemy RPC URL from environment variable (fallback only)
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
const alchemyRpcUrl = alchemyApiKey 
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  : null;

// Check if window.ethereum is available (browser environment with wallet)
const hasInjectedProvider = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

// Debug logging
console.log('🔧 Wagmi Config:', {
  hasInjectedProvider,
  usingMetaMaskRPC: hasInjectedProvider,
  hasAlchemyFallback: !!alchemyRpcUrl,
});

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: hasInjectedProvider
      ? custom(window.ethereum)
      : fallback([
          ...(alchemyRpcUrl ? [http(alchemyRpcUrl)] : []),
          http('https://base.drpc.org'),
          http('https://rpc.ankr.com/base'),
          http('https://mainnet.base.org'),
        ]),
  },
});
