// AI Agent's XMTP inbox ID
export const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '';
export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'production') as 'production' | 'dev' | 'local';
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
