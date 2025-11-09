import { NEYNAR_API_KEY } from "./constants";

/**
 * Normalize pfp_url to ensure it has the correct protocol
 * Handles cases where the URL is missing https: or starts with //
 */
function normalizePfpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return url;
}

/**
 * Fetch user profile data from Neynar by FID using raw API
 */
export async function fetchUserProfile(fid: number) {
  try {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`;
    
    console.log('🔍 Fetching from Neynar API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': NEYNAR_API_KEY,
        'x-neynar-experimental': 'false',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('🔍 Neynar API full response:', JSON.stringify(data, null, 2));
    
    if (data.users && data.users.length > 0) {
      const user = data.users[0];
      
      console.log('🔍 User object structure:', JSON.stringify(user, null, 2));
      console.log('🔍 Raw PFP URL from response:', user.pfp_url);
      
      // Normalize pfp_url to ensure it has the correct protocol
      const normalizedPfpUrl = normalizePfpUrl(user.pfp_url);
      console.log('🔍 Normalized PFP URL:', normalizedPfpUrl);
      
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: normalizedPfpUrl,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        powerBadge: user.power_badge,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Neynar:', error);
    throw error;
  }
}
