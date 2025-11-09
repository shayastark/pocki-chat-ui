import { NextRequest, NextResponse } from 'next/server';
import { fetchUserProfile } from '@/lib/neynar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fidParam = searchParams.get('fid');

  console.log('📨 API route /api/farcaster/profile called with FID:', fidParam);

  if (!fidParam) {
    console.error('❌ Missing FID parameter');
    return NextResponse.json({ error: 'FID parameter is required' }, { status: 400 });
  }

  const fid = parseInt(fidParam, 10);
  if (isNaN(fid)) {
    console.error('❌ Invalid FID parameter:', fidParam);
    return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
  }

  try {
    console.log('🔄 Calling fetchUserProfile for FID:', fid);
    const profile = await fetchUserProfile(fid);
    
    console.log('📦 fetchUserProfile returned:', profile);
    
    if (!profile) {
      console.warn('⚠️ Profile not found for FID:', fid);
      return NextResponse.json({ error: 'User not found or NEYNAR_API_KEY not configured' }, { status: 404 });
    }

    console.log('✅ Returning profile:', profile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('❌ Error in API route:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
