import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NEYNAR_API_KEY } from "./constants";

if (!NEYNAR_API_KEY) {
  console.warn('⚠️ NEYNAR_API_KEY is not set. Farcaster profile features will not work.');
}

const config = new Configuration({
  apiKey: NEYNAR_API_KEY || '',
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
  if (!NEYNAR_API_KEY) {
    console.error('❌ Cannot fetch Farcaster profile: NEYNAR_API_KEY is not set');
    return null;
  }

  try {
    console.log('🔍 Fetching Farcaster profile for FID:', fid);
    const response = await client.fetchBulkUsers([fid]);
    
    console.log('📦 Neynar API response:', JSON.stringify(response, null, 2));
    
    if (response.users && response.users.length > 0) {
      const user = response.users[0];
      
      console.log('👤 Raw user data from Neynar:', {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        follower_count: user.follower_count,
        following_count: user.following_count,
        power_badge: user.power_badge,
      });
      
      const profile = {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name || user.username || '',
        pfpUrl: user.pfp_url || '',
        followerCount: user.follower_count,
        followingCount: user.following_count,
        powerBadge: user.power_badge || false,
      };
      
      console.log('✅ Mapped profile data:', profile);
      return profile;
    }
    
    console.warn('⚠️ No user found in Neynar response for FID:', fid);
    return null;
  } catch (error) {
    console.error('❌ Error fetching user profile from Neynar:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return null; // Return null instead of throwing to prevent app crashes
  }
}

/**
 * Fetch user profile data from Neynar by Ethereum address using Neynar SDK
 */
export async function fetchUserByAddress(address: string) {
  if (!NEYNAR_API_KEY) {
    console.error('❌ Cannot fetch Farcaster profile: NEYNAR_API_KEY is not set');
    return null;
  }

  try {
    console.log('🔍 Fetching Farcaster profile for address:', address);
    const response = await client.getUserByVerifiedAddress(address);
    
    console.log('📦 Neynar API response for address:', JSON.stringify(response, null, 2));
    
    if (response && response.user) {
      const user = response.user;
      
      console.log('👤 Raw user data from Neynar:', {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        follower_count: user.follower_count,
        following_count: user.following_count,
        power_badge: user.power_badge,
      });
      
      const profile = {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name || user.username || '',
        pfpUrl: user.pfp_url || '',
        followerCount: user.follower_count,
        followingCount: user.following_count,
        powerBadge: user.power_badge || false,
      };
      
      console.log('✅ Mapped profile data:', profile);
      return profile;
    }
    
    console.log('ℹ️ No Farcaster account found for address:', address);
    return null;
  } catch (error) {
    console.log('ℹ️ No Farcaster profile found for address:', address);
    // Return null instead of throwing, as the user may not have a Farcaster account
    return null;
  }
}
