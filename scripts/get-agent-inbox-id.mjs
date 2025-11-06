#!/usr/bin/env node

/**
 * Get XMTP Inbox ID from Wallet Address
 * 
 * This script connects to XMTP with your agent's wallet and retrieves its inbox ID.
 * You need this inbox ID (not the wallet address!) for XMTP V3 Browser SDK.
 * 
 * Usage:
 *   node scripts/get-agent-inbox-id.mjs
 *   
 * You'll be prompted for your agent's private key.
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
  console.log('║   Get XMTP Inbox ID from Wallet Address                   ║');
  console.log('║   For XMTP V3 Browser SDK Configuration                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Get private key from user
    console.log('📝 Enter your agent\'s wallet private key:');
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
    console.log('\n🌐 Connecting to XMTP (this may take a moment)...');
    console.log('💡 You may need to approve signature requests');
    
    const env = process.env.NEXT_PUBLIC_XMTP_ENV || 'production';
    console.log(`📡 Environment: ${env}`);
    
    const client = await Client.create(signer, { 
      env: env
    });
    
    console.log('\n✅ Successfully connected to XMTP!');
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  📋 YOUR AGENT\'S INFO                      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');
    console.log(`║ Wallet Address:                                            ║`);
    console.log(`║ ${account.address}       ║`);
    console.log('║                                                            ║');
    console.log(`║ XMTP Inbox ID (USE THIS!):                                 ║`);
    console.log(`║ ${client.inboxId}       ║`);
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Check installation count
    console.log('\n📊 Additional Info:');
    try {
      const installations = await client.getInstallations();
      console.log(`   Installations: ${installations.length}/10`);
    } catch (err) {
      console.log('   Installations: Could not fetch');
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✨ NEXT STEPS ✨                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ 1. Copy the Inbox ID above                                ║');
    console.log('║                                                            ║');
    console.log('║ 2. Update your environment variable:                      ║');
    console.log('║    NEXT_PUBLIC_AGENT_ADDRESS=<inbox_id>                   ║');
    console.log('║                                                            ║');
    console.log('║ 3. Redeploy your app                                      ║');
    console.log('║                                                            ║');
    console.log('║ 4. Users can now message your agent! 🎉                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('💡 TIP: The Inbox ID is tied to your wallet address.');
    console.log('    It will always be the same for this wallet.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    rl.close();
  }
}

main();
