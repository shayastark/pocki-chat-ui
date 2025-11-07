import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NEYNAR_API_KEY } from "./constants";

let neynarClient: NeynarAPIClient | null = null;

/**
 * Get or create a singleton Neynar API client
 */
export function getNeynarClient(): NeynarAPIClient {
  if (!neynarClient) {
    const config = new Configuration({
      apiKey: NEYNAR_API_KEY,
    });
    neynarClient = new NeynarAPIClient(config);
  }
  return neynarClient;
}

/**
 * Fetch user profile data from Neynar by FID
 */
export async function fetchUserProfile(fid: number) {
  try {
    const client = getNeynarClient();
    const response = await client.fetchBulkUsers({ fids: [fid] });
    
    console.log('🔍 Neynar API full response:', JSON.stringify(response, null, 2));
    
    if (response.users && response.users.length > 0) {
      const user = response.users[0];
      
      console.log('🔍 User object structure:', JSON.stringify(user, null, 2));
      console.log('🔍 PFP field paths:', {
        'user.pfp_url': (user as any).pfp_url,
        'user.pfp': user.pfp,
        'user.pfp?.url': user.pfp?.url,
        'user.profile?.pfp?.url': (user as any).profile?.pfp?.url,
      });
      
      // Prioritize pfp_url as the primary field from Neynar API response
      const pfpUrl = (user as any).pfp_url || user.pfp?.url || (user as any).profile?.pfp?.url || null;
      
      console.log('✅ Extracted pfp URL:', pfpUrl);
      
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: pfpUrl,
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
