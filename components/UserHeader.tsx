'use client';

import { useEffect, useState } from 'react';
import { getName, getAvatar } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import Image from 'next/image';
import { useMiniApp } from '@/app/contexts/MiniAppContext';
import { useTheme } from '@/app/contexts/ThemeContext';

interface UserHeaderProps {
  address: string;
  onLogout: () => void;
}

export function UserHeader({ address, onLogout }: UserHeaderProps) {
  const { farcasterProfile } = useMiniApp();
  const { theme, toggleTheme } = useTheme();
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
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-panda-green-200 bg-gray-100">
        <Image
          src={getDisplayAvatar()}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized={!avatarUrl && !farcasterProfile?.pfpUrl} // Unoptimized for data URIs (identicons)
          onError={(e) => {
            console.error('❌ Image failed to load:', getDisplayAvatar());
            // Fallback to identicon on error
            const avatar = createAvatar(identicon, {
              seed: address,
              size: 128,
            });
            (e.target as HTMLImageElement).src = avatar.toDataUri();
          }}
        />
      </div>

      {/* Name or Address */}
      <div className="flex flex-col">
        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-none">
          {displayName}
          {farcasterProfile?.powerBadge && (
            <span className="ml-1 inline-block text-purple-500" title="Power Badge">
              ⚡
            </span>
          )}
        </span>
        {(farcasterProfile?.username || basename) && (
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {farcasterProfile ? `@${farcasterProfile.username}` : address.slice(0, 6) + '...' + address.slice(-4)}
          </span>
        )}
      </div>

      {/* Theme Toggle - Compact */}
      <button
        onClick={toggleTheme}
        className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <svg
            className="w-5 h-5 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
            />
          </svg>
        )}
      </button>

      {/* Logout Button - Bigger and Text-Only */}
      <button
        onClick={onLogout}
        className="ml-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors shadow-sm"
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}
