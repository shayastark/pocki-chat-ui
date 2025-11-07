'use client';

import { useEffect, useState } from 'react';
import { getName, getAvatar } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import Image from 'next/image';

interface UserHeaderProps {
  address: string;
  onLogout: () => void;
}

export function UserHeader({ address, onLogout }: UserHeaderProps) {
  const [basename, setBasename] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBasenameData() {
      if (!address) {
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
  }, [address]);

  // Generate identicon if no avatar is available
  const getDisplayAvatar = () => {
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

  // Display name: Basename or truncated address
  const displayName = basename || `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (isLoading) {
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
          unoptimized={!avatarUrl} // Unoptimized for data URIs (identicons)
        />
      </div>

      {/* Name or Address */}
      <div className="flex flex-col">
        <span className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">
          {displayName}
        </span>
        {basename && (
          <span className="text-xs text-gray-500 hidden sm:block">
            {address.slice(0, 6)}...{address.slice(-4)}
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
