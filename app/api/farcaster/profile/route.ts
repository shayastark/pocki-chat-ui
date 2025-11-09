import { NextRequest, NextResponse } from 'next/server';
import { fetchUserProfile } from '@/lib/neynar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fidParam = searchParams.get('fid');

  if (!fidParam) {
    return NextResponse.json({ error: 'FID parameter is required' }, { status: 400 });
  }

  const fid = parseInt(fidParam, 10);
  if (isNaN(fid)) {
    return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
  }

  try {
    const profile = await fetchUserProfile(fid);
    
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching Farcaster profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
