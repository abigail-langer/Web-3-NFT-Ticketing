'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contract';
import Link from 'next/link';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function CheckInPage() {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [lastTokenId, setLastTokenId] = useState<string | null>(null);
  const [lastOccasionId, setLastOccasionId] = useState<number | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleScan = async (result: string) => {
    if (!result || result === lastScanned) return;
    
    setLastScanned(result);
    setScanning(false);
    
    try {
      const data = JSON.parse(result);
      const { tokenId, occasionId, type, contract } = data;
      
      // Validate QR code format
      if (type !== 'ticket-checkin' || contract !== CONTRACT_ADDRESS) {
        setErrorMessage('Invalid ticket QR code');
        setCheckInStatus('error');
        return;
      }
      
      // 保存 tokenId 和 occasionId 用于后续记录
      setLastTokenId(tokenId);
      setLastOccasionId(occasionId);
      
      // Call check-in function
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'checkIn',
        args: [BigInt(tokenId)],
      });
      
    } catch (error: any) {
      console.error('Scan error:', error);
      setErrorMessage(error.message || 'Scan failed, please try again');
      setCheckInStatus('error');
    }
  };

  // Listen for transaction success and record to database
  useEffect(() => {
    const recordCheckIn = async () => {
      if (isSuccess && hash && publicClient && lastTokenId && lastOccasionId && checkInStatus !== 'success') {
        try {
          // 获取交易收据
          const receipt = await publicClient.getTransactionReceipt({ hash });
          const blockNumber = receipt.blockNumber;

          // 记录检票到数据库
          await fetch('http://localhost:3001/api/tickets/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenId: lastTokenId,
              occasionId: lastOccasionId,
              txHash: hash,
              blockNumber: Number(blockNumber),
            }),
          });

          console.log(`✅ Check-in recorded: Token #${lastTokenId}, Block ${blockNumber}`);
        } catch (error) {
          console.error('Failed to record check-in:', error);
        }

        setCheckInStatus('success');
        setTimeout(() => {
          setCheckInStatus('idle');
          setLastScanned(null);
          setLastTokenId(null);
          setLastOccasionId(null);
          setScanning(true);
        }, 3000);
      }
    };

    recordCheckIn();
  }, [isSuccess, hash, publicClient, lastTokenId, lastOccasionId, checkInStatus]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Home</Link>
          <ConnectButton />
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 text-center">
          🎫 Ticket Check-In System
        </h1>

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Please connect your wallet first</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="mb-6 text-center">
                <p className="text-lg mb-2">
                  <span className="font-bold">Inspector:</span> {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <p className="text-sm text-gray-400">
                  Only event organizers can perform check-in operations
                </p>
              </div>

              {!scanning ? (
                <div className="text-center space-y-4">
                  <button
                    onClick={() => {
                      setScanning(true);
                      setCheckInStatus('idle');
                      setErrorMessage('');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-bold text-xl transition-all"
                  >
                    📷 Start Scanning
                  </button>
                  
                  {checkInStatus === 'success' && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                      <p className="text-green-300 font-bold text-lg">✅ Check-In Successful!</p>
                      <p className="text-sm text-gray-300 mt-2">Auto-resuming scan in 3 seconds...</p>
                    </div>
                  )}
                  
                  {checkInStatus === 'error' && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                      <p className="text-red-300 font-bold text-lg">❌ Check-In Failed</p>
                      <p className="text-sm text-gray-300 mt-2">{errorMessage}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-black rounded-lg overflow-hidden">
                    <Scanner
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          handleScan(result[0].rawValue);
                        }
                      }}
                      onError={(error) => {
                        console.error('Scanner error:', error);
                        setErrorMessage('Camera access failed');
                        setCheckInStatus('error');
                        setScanning(false);
                      }}
                      constraints={{
                        facingMode: 'environment'
                      }}
                      styles={{
                        container: {
                          width: '100%',
                          paddingTop: '100%',
                          position: 'relative'
                        },
                        video: {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }
                      }}
                    />
                  </div>
                  
                  <div className="text-center text-sm text-gray-400">
                    <p>Point the ticket QR code at the camera</p>
                  </div>
                  
                  {isPending && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-center">
                      <p className="text-yellow-300 font-bold">⏳ Processing check-in...</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setScanning(false)}
                    className="w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-bold transition-all"
                  >
                    Cancel Scan
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3">📋 Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>1. Ensure you are the event organizer account</li>
                <li>2. Click the "Start Scanning" button</li>
                <li>3. Point the user's ticket QR code at the camera</li>
                <li>4. The system will automatically recognize and complete check-in</li>
                <li>5. After successful check-in, it will automatically continue scanning the next ticket</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
