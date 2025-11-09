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
        displayName: user.displayName || user.username,
        pfpUrl: user.pfp?.url || user.pfp_url || null,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        powerBadge: user.powerBadge,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Neynar:', error);
    throw error;
  }
}
