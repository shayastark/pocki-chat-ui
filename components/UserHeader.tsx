'use client';

import { useEffect, useState } from 'react';
import { getName, getAvatar } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import Image from 'next/image';
import { useMiniApp } from '@/app/contexts/MiniAppContext';

interface UserHeaderProps {
  address: string;
  onLogout: () => void;
}

export function UserHeader({ address, onLogout }: UserHeaderProps) {
  const { farcasterProfile } = useMiniApp();
  const [basename, setBasename] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBasenameData() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      // Skip Basename lookup if we already have Farcaster profile data
      if (farcasterProfile) {
        console.log('✅ Using Farcaster profile, skipping Basename lookup');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch Basename for the address
        const name = await getName({ address: address as `0x${string}`, chain: base });
        
        if (name) {
          setBasename(name);
          
          // If we have a Basename, try to get the avatar
          try {
            const avatar = await getAvatar({ ensName: name, chain: base });
            if (avatar) {
              setAvatarUrl(avatar);
            }
          } catch (avatarError) {
            console.log('No avatar found for Basename, will use identicon');
          }
        }
      } catch (error) {
        console.log('No Basename found for address, will show truncated address');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBasenameData();
  }, [address, farcasterProfile]);

  // Generate identicon if no avatar is available
  const getDisplayAvatar = () => {
    // Prioritize Farcaster profile picture
    if (farcasterProfile?.pfpUrl) {
      return farcasterProfile.pfpUrl;
    }
    
    if (avatarUrl) {
      return avatarUrl;
    }
    
    // Generate identicon from wallet address
    const avatar = createAvatar(identicon, {
      seed: address,
      size: 128,
    });
    
    return avatar.toDataUri();
  };

  // Display name: Prioritize Farcaster display name > Farcaster username > Basename > truncated address
  const displayName = farcasterProfile?.displayName 
    || farcasterProfile?.username 
    || basename 
    || `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Show loading state only if we're fetching Basename and we don't have Farcaster profile yet
  if (isLoading && !farcasterProfile) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Avatar */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-panda-green-200">
        <Image
          src={getDisplayAvatar()}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized={!avatarUrl && !farcasterProfile?.pfpUrl} // Unoptimized for data URIs (identicons)
        />
      </div>

      {/* Name or Address */}
      <div className="flex flex-col">
        <span className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">
          {displayName}
          {farcasterProfile?.powerBadge && (
            <span className="ml-1 inline-block text-purple-500" title="Power Badge">
              ⚡
            </span>
          )}
        </span>
        {(farcasterProfile?.username || basename) && (
          <span className="text-xs text-gray-500 hidden sm:block">
            {farcasterProfile ? `@${farcasterProfile.username}` : address.slice(0, 6) + '...' + address.slice(-4)}
          </span>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="ml-2 sm:ml-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Logout"
      >
        <span className="sm:hidden">↗</span>
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
