import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';

const getDomain = () => {
  const replitDomain = process.env.REPLIT_DOMAINS;
  if (replitDomain) {
    return replitDomain.split(',')[0];
  }
  return process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000';
};

const domain = getDomain();
const client = createClient();

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = await client.verifyJwt({ token, domain });

    return NextResponse.json({
      fid: payload.sub,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Quick Auth verification error:', e);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
