import { NextRequest, NextResponse } from 'next/server';
import { fetchUserByAddress } from '@/lib/neynar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  console.log('📨 API route /api/farcaster/profile-by-address called with address:', address);

  if (!address) {
    console.error('❌ Missing address parameter');
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    console.log('🔄 Calling fetchUserByAddress for address:', address);
    const profile = await fetchUserByAddress(address);
    
    console.log('📦 fetchUserByAddress returned:', profile);
    
    if (!profile) {
      console.log('ℹ️ Profile not found for address:', address);
      return NextResponse.json({ error: 'User not found or NEYNAR_API_KEY not configured' }, { status: 404 });
    }

    console.log('✅ Returning profile:', profile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('❌ Error in API route:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
