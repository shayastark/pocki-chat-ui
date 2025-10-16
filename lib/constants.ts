export const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0xd003c8136e974da7317521ef5866c250f17ad155';
export const XMTP_ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || 'production') as 'production' | 'dev' | 'local';
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
