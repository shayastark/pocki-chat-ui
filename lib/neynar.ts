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
    
    if (response.users && response.users.length > 0) {
      const user = response.users[0];
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp?.url || null,
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
