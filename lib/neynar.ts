import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NEYNAR_API_KEY } from "./constants";

const config = new Configuration({
  apiKey: NEYNAR_API_KEY,
});
const client = new NeynarAPIClient(config);

/**
 * Fetch user profile data from Neynar by FID using Neynar SDK
 */
export async function fetchUserProfile(fid: number) {
  try {
    const response = await client.lookupUserByFid(fid);
    
    if (response.result?.user) {
      const user = response.result.user;
      
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.displayName || user.username,
        pfpUrl: user.pfp?.url || '',
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        powerBadge: user.powerBadge || false,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Neynar:', error);
    return null;
  }
}

/**
 * Fetch user profile data from Neynar by Ethereum address using Neynar SDK
 */
export async function fetchUserByAddress(address: string) {
  try {
    const userLookup = await client.lookupUserByVerificationAddress(address);
    const fid = userLookup.result.user.fid;
    
    // Get full profile details by FID
    const userProfile = await client.lookupUserByFid(fid);
    
    if (userProfile.result?.user) {
      const user = userProfile.result.user;
      
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.displayName || user.username,
        pfpUrl: user.pfp?.url || '',
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        powerBadge: user.powerBadge || false,
      };
    }
    
    return null;
  } catch (error) {
    // Return null instead of throwing, as the user may not have a Farcaster account
    return null;
  }
}
