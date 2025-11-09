'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, usePublicClient, useReadContract } from 'wagmi';
import { parseEther, type Address, erc20Abi } from 'viem';

interface TransactionCall {
  to: Address;
  value?: string;
  data?: `0x${string}`;
  metadata?: {
    description?: string;
    transactionType?: string;
    amount?: string;
    currency?: string;
    decimals?: number;
  };
}

interface XMTPWalletSendCallsParams {
  version: string;
  from: Address;
  chainId: string;
  calls: TransactionCall[];
}

interface LegacyTransactionRequest {
  type: 'transfer' | 'approve' | 'swap';
  to: Address;
  amount: string;
  token?: Address;
  data?: `0x${string}`;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: XMTPWalletSendCallsParams | LegacyTransactionRequest | null;
}

interface CallResult {
  hash?: `0x${string}`;
  error?: string;
  confirmed?: boolean;
  confirming?: boolean;
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { address, chainId: currentChainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState<number>(-1);
  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const isXMTPFormat = 'calls' in transaction && 'version' in transaction;
  
  const handleConfirm = async () => {
    if (!transaction || !address || !publicClient) return;

    setIsExecuting(true);
    setGlobalError(null);

    if (isXMTPFormat) {
      const xmtpTx = transaction as XMTPWalletSendCallsParams;
      
      if (xmtpTx.from.toLowerCase() !== address.toLowerCase()) {
        setGlobalError(`Transaction requires wallet ${xmtpTx.from.slice(0, 6)}...${xmtpTx.from.slice(-4)}, but you're connected with ${address.slice(0, 6)}...${address.slice(-4)}`);
        setIsExecuting(false);
        return;
      }
      
      const targetChainId = parseInt(xmtpTx.chainId, 16);
      if (currentChainId !== targetChainId) {
        setGlobalError(`Please switch to chain ${targetChainId} (Base). Currently on chain ${currentChainId}`);
        setIsExecuting(false);
        return;
      }

      if (xmtpTx.calls.length === 0) {
        setGlobalError('No transaction calls to execute');
        setIsExecuting(false);
        return;
      }

      const results: CallResult[] = new Array(xmtpTx.calls.length).fill({});
      setCallResults(results);

      // Check if any call uses 0x AllowanceHolder
      const zeroXAllowanceHolder = '0x0000000000001ff3684f28c67538d4d072c22734';
      
      for (let i = 0; i < xmtpTx.calls.length; i++) {
        setCurrentCallIndex(i);
        const call = xmtpTx.calls[i];
        
        try {
          console.log(`Executing call ${i + 1}/${xmtpTx.calls.length}:`, call);
          
          // For 0x AllowanceHolder transactions, try automatic estimation first
          // If estimation fails (likely due to missing approval), use high fallback
          const isAllowanceHolderCall = call.to.toLowerCase() === zeroXAllowanceHolder.toLowerCase();
          let gasLimit: bigint | undefined = undefined;
          
          if (isAllowanceHolderCall) {
            try {
              // Attempt automatic gas estimation
              const estimated = await publicClient.estimateGas({
                account: address,
                to: call.to as Address,
                value: call.value ? BigInt(call.value) : undefined,
                data: call.data,
              });
              gasLimit = estimated;
              console.log('✅ Gas estimation succeeded:', estimated.toString());
            } catch (estimationError: any) {
              // Estimation failed (likely missing approval), use high conservative fallback
              gasLimit = BigInt(1500000); // 1.5M should cover complex multi-hop + permit2
              console.log('⚠️ Gas estimation failed (likely missing approval), using fallback:', gasLimit.toString());
              console.log('Estimation error:', estimationError.message);
            }
          }
          
          const hash = await sendTransactionAsync({
            to: call.to as Address,
            value: call.value ? BigInt(call.value) : undefined,
            data: call.data,
            gas: gasLimit,
          });

          console.log(`Call ${i + 1} hash:`, hash);
          console.log(`Waiting for confirmation of call ${i + 1}...`);
          
          const receipt = await publicClient.waitForTransactionReceipt({ 
            hash,
            confirmations: 1,
          });

          if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted on-chain');
          }

          console.log(`Call ${i + 1} confirmed:`, receipt.transactionHash);
          results[i] = { hash, confirmed: true };
          setCallResults([...results]);
          
          if (i < xmtpTx.calls.length - 1) {
            console.log('Waiting 10 seconds before next transaction to avoid rate limits...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          
        } catch (err: any) {
          console.error(`Failed to execute call ${i + 1}:`, err);
          results[i] = { ...results[i], error: err.message || 'Transaction failed', confirming: false };
          setCallResults([...results]);
          setGlobalError(`Call ${i + 1} failed: ${err.message || 'Transaction rejected'}`);
          setIsExecuting(false);
          setCurrentCallIndex(-1);
          return;
        }
      }

      setCurrentCallIndex(-1);
      setIsExecuting(false);
      console.log('All calls executed and confirmed successfully');
    } else {
      const legacyTx = transaction as LegacyTransactionRequest;
      
      try {
        const hash = await sendTransactionAsync({
          to: legacyTx.to,
          value: legacyTx.type === 'transfer' ? parseEther(legacyTx.amount) : undefined,
          data: legacyTx.data,
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          confirmations: 1,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted on-chain');
        }

        setCallResults([{ hash, confirmed: true }]);
        setIsExecuting(false);
      } catch (err: any) {
        setGlobalError(err.message || 'Transaction failed');
        setCallResults([{ error: err.message }]);
        setIsExecuting(false);
      }
    }
  };

  const renderTransactionDetails = () => {
    if (isXMTPFormat) {
      const xmtpTx = transaction as XMTPWalletSendCallsParams;
      
      return (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-panda-green-50 to-green-50 rounded-2xl p-6 space-y-3">
            {xmtpTx.calls.map((call, idx) => {
              const result = callResults[idx];
              const isCurrent = currentCallIndex === idx;
              const isConfirmed = result?.confirmed;
              const hasError = result?.error;
              const isSigning = isCurrent && !isConfirmed;
              
              return (
                <div key={idx}>
                  {/* Swap Description */}
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {call.metadata?.description || `Transaction ${idx + 1}`}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isSigning && (
                    <div className="bg-white/80 rounded-xl p-4 text-center border border-panda-green-200">
                      <div className="text-panda-green-600 font-medium">
                        ⏳ Please confirm in your wallet...
                      </div>
                    </div>
                  )}
                  
                  {isConfirmed && (
                    <div className="bg-white/80 rounded-xl p-4 text-center border border-green-200">
                      <div className="text-green-600 font-medium">
                        ✅ Transaction confirmed!
                      </div>
                      {result?.hash && (
                        <div className="text-xs text-gray-600 font-mono mt-2">
                          <a
                            href={`https://basescan.org/tx/${result.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-800"
                          >
                            View on BaseScan
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {hasError && (
                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                      <div className="text-red-600 font-medium">
                        ❌ Transaction failed
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {result.error}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      const legacyTx = transaction as LegacyTransactionRequest;
      const result = callResults[0];
      
      return (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-panda-green-50 to-green-50 rounded-2xl p-6">
            {/* Transaction Description */}
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-gray-900 capitalize">
                {legacyTx.type} {legacyTx.amount} ETH
              </div>
            </div>

            {/* Status Indicator */}
            {isExecuting && !result?.confirmed && (
              <div className="bg-white/80 rounded-xl p-4 text-center border border-panda-green-200">
                <div className="text-panda-green-600 font-medium">
                  ⏳ Please confirm in your wallet...
                </div>
              </div>
            )}
            
            {result?.confirmed && (
              <div className="bg-white/80 rounded-xl p-4 text-center border border-green-200">
                <div className="text-green-600 font-medium">
                  ✅ Transaction confirmed!
                </div>
                {result?.hash && (
                  <div className="text-xs text-gray-600 font-mono mt-2">
                    <a
                      href={`https://basescan.org/tx/${result.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-800"
                    >
                      View on BaseScan
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {result?.error && (
              <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                <div className="text-red-600 font-medium">
                  ❌ Transaction failed
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {result.error}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const allCallsCompleted = isXMTPFormat 
    ? callResults.length === (transaction as XMTPWalletSendCallsParams).calls.length && 
      callResults.every(r => r.confirmed)
    : callResults[0]?.confirmed;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐼</div>
          <h2 className="text-2xl font-bold text-gray-900">Confirm Transaction</h2>
        </div>

        {renderTransactionDetails()}

        {globalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{globalError}</p>
          </div>
        )}

        {allCallsCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 text-sm font-semibold">
              ✅ All transactions confirmed on-chain!
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              setCallResults([]);
              setCurrentCallIndex(-1);
              setGlobalError(null);
            }}
            disabled={isExecuting}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {allCallsCompleted ? 'Close' : 'Cancel'}
          </button>
          {!allCallsCompleted && (
            <button
              onClick={handleConfirm}
              disabled={isExecuting}
              className="flex-1 bg-panda-green-600 hover:bg-panda-green-700 disabled:bg-panda-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isExecuting ? 'Processing...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
