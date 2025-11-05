// AI Agent's XMTP inbox ID
export const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '';

// AI Agent's wallet address (for Base App deeplinks)
// This is what pocki.base.eth resolves to
export const AGENT_WALLET_ADDRESS = '0xd003c8136e974da7317521ef5866c250f17ad155';

// Agent's ENS basename
export const AGENT_BASENAME = 'pocki.base.eth';

export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'production') as 'production' | 'dev' | 'local';
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
export const PRIVY_BASE_APP_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_BASE_APP_CLIENT_ID || '';
