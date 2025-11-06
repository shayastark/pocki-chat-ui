#!/usr/bin/env node

/**
 * XMTP Installation Cleanup Script
 * 
 * This is a ONE-TIME maintenance script to revoke all XMTP installations
 * when you hit the 10/10 installation limit.
 * 
 * DO NOT add this to your agent's code - it's only for manual cleanup!
 * 
 * Usage:
 *   1. Make sure you have your wallet's private key ready
 *   2. Run: node scripts/revoke-xmtp-installations.js
 *   3. Follow the prompts
 *   4. After successful revocation, clear your browser's localStorage
 *   5. Refresh your app - you'll be at 1/10!
 */

import { Client } from '@xmtp/browser-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   XMTP Installation Cleanup Script                        ║');
  console.log('║   ⚠️  ONE-TIME USE ONLY - NOT FOR PRODUCTION CODE         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Get private key from user
    console.log('📝 Enter your wallet\'s private key:');
    console.log('   (This stays on your machine - never shared)');
    const privateKey = await question('Private Key (0x...): ');
    
    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('Invalid private key format. Must start with 0x');
    }

    console.log('\n🔐 Creating wallet client...');
    
    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    console.log('✅ Wallet address:', account.address);
    
    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http()
    });

    // Create XMTP signer
    console.log('\n🔧 Creating XMTP signer...');
    const signer = {
      type: 'EOA',
      getIdentifier: () => ({
        identifier: account.address.toLowerCase(),
        identifierKind: 'Ethereum'
      }),
      signMessage: async (message) => {
        const messageText = typeof message === 'string' ? message : message.message;
        const signature = await walletClient.signMessage({
          account,
          message: messageText
        });
        
        // Convert hex signature to Uint8Array
        const hexString = signature.startsWith('0x') ? signature.slice(2) : signature;
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
        }
        return bytes;
      }
    };

    // Connect to XMTP
    console.log('🌐 Connecting to XMTP (this may take a moment)...');
    console.log('💡 You may need to approve signature requests');
    
    const client = await Client.create(signer, { 
      env: 'production'  // Change to 'dev' if your agent uses dev environment
    });
    
    console.log('✅ Connected to XMTP!');
    console.log('📬 Inbox ID:', client.inboxId);

    // Check installation count
    console.log('\n📊 Checking installations...');
    const installations = await client.getInstallations();
    console.log(`Current: ${installations.length}/10 installations`);

    if (installations.length === 0) {
      console.log('✨ No installations to revoke. You\'re all clear!');
      rl.close();
      return;
    }

    // Confirm before revoking
    console.log('\n⚠️  WARNING: This will revoke ALL installations!');
    console.log('   You will need to reconnect all devices.');
    const confirm = await question('\nAre you sure? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled. No changes made.');
      rl.close();
      return;
    }

    // Revoke all installations
    console.log('\n🔄 Revoking all installations...');
    await client.revokeAllInstallations();
    
    console.log('✅ All installations revoked!');
    console.log('📊 Now at 0/10 installations');

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✨ NEXT STEPS ✨                        ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ 1. Clear your browser\'s XMTP data:                        ║');
    console.log('║    • Open browser console                                  ║');
    console.log('║    • Run: localStorage.removeItem("xmtp_installation_key_YOUR_ADDRESS") ║');
    console.log('║                                                            ║');
    console.log('║ 2. Refresh your Pocki Chat app                            ║');
    console.log('║                                                            ║');
    console.log('║ 3. Reconnect - you\'ll be at 1/10! 🎉                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    rl.close();
  }
}

main();
