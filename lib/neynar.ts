import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NEYNAR_API_KEY } from "./constants";

const client = new NeynarAPIClient(NEYNAR_API_KEY);

/**
 * Fetch user profile data from Neynar by FID using Neynar SDK
 */
export async function fetchUserProfile(fid: number) {
  try {
    const response = await client.fetchBulkUsers([fid]);
    
    if (response.users && response.users.length > 0) {
      const user = response.users[0];
      
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
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
