import { createConfig } from '@privy-io/wagmi';
import { base } from 'viem/chains';
import { http, fallback } from 'viem';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: fallback([
      http('https://base.drpc.org'),
      http('https://rpc.ankr.com/base'),
      http('https://mainnet.base.org'),
    ]),
  },
});
