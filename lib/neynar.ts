import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NEYNAR_API_KEY } from "./constants";

const config = new Configuration({
  apiKey: NEYNAR_API_KEY,
  baseOptions: {
    headers: {
      "x-neynar-experimental": true,
    },
  },
});

const client = new NeynarAPIClient(config);

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

/**
 * Fetch user profile data from Neynar by Ethereum address using Neynar SDK
 */
export async function fetchUserByAddress(address: string) {
  try {
    const response = await client.getUserByVerifiedAddress(address);
    
    if (response && response.user) {
      const user = response.user;
      
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
    console.error('Error fetching user profile by address from Neynar:', error);
    // Return null instead of throwing, as the user may not have a Farcaster account
    return null;
  }
}
