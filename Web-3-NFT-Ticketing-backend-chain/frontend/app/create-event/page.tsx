'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contract';
import { parseEther } from 'viem';
import Link from 'next/link';

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    name: '',
    cost: '0',
    maxTickets: '',
    date: '',
    time: '',
    location: '',
    resellable: true,
    earlySaleDate: '',
    earlySaleTime: '',
    publicSaleDate: '',
    publicSaleTime: '',
    eventEndDate: '',
    eventEndTime: '',
    enableEarlySale: false,
    enablePOAP: false,
    enablePrioritySeats: false,
  });

  const [settingPrioritySeats, setSettingPrioritySeats] = useState(false);
  const [prioritySeatsDone, setPrioritySeatsDone] = useState(false);

  const { isConnected } = useAccount();
  const router = useRouter();
  const publicClient = usePublicClient();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 读取totalOccasions来获取新创建的活动ID
  const { data: totalOccasions, refetch: refetchTotalOccasions } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'totalOccasions',
  });

  // 当活动创建成功后,设置优先座位
  useEffect(() => {
    const setPrioritySeats = async () => {
      if (isSuccess && formData.enablePrioritySeats && !settingPrioritySeats && !prioritySeatsDone) {
        setSettingPrioritySeats(true);

        try {
          // 重新获取totalOccasions
          const result = await refetchTotalOccasions();
          const newEventId = result.data;

          if (newEventId) {
            console.log(`Setting priority seats for event #${newEventId}`);

            // 调用setPrioritySeats
            const prioritySeats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            writeContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'setPrioritySeats',
              args: [newEventId, prioritySeats],
            });

            setPrioritySeatsDone(true);
          }
        } catch (error) {
          console.error('Failed to set priority seats:', error);
          alert('Event created but failed to set priority seats. You can set them manually later.');
        } finally {
          setSettingPrioritySeats(false);
        }
      }
    };

    setPrioritySeats();
  }, [isSuccess, formData.enablePrioritySeats, settingPrioritySeats, prioritySeatsDone, refetchTotalOccasions, writeContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.maxTickets || !formData.date || !formData.time || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.publicSaleDate || !formData.publicSaleTime) {
      alert('Please set the public sale date and time');
      return;
    }

    if (!formData.eventEndDate || !formData.eventEndTime) {
      alert('Please set the event end date and time');
      return;
    }

    try {
      const costInWei = formData.cost === '0' ? 0n : parseEther(formData.cost);

      // Parse dates
      const publicSaleTimestamp = Math.floor(new Date(`${formData.publicSaleDate}T${formData.publicSaleTime}`).getTime() / 1000);
      const eventEndTimestamp = Math.floor(new Date(`${formData.eventEndDate}T${formData.eventEndTime}`).getTime() / 1000);

      let earlySaleTimestamp = 0;
      if (formData.enableEarlySale && formData.earlySaleDate && formData.earlySaleTime) {
        earlySaleTimestamp = Math.floor(new Date(`${formData.earlySaleDate}T${formData.earlySaleTime}`).getTime() / 1000);
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'list',
        args: [
          formData.name,
          costInWei,
          BigInt(formData.maxTickets),
          formData.date,
          formData.time,
          formData.location,
          formData.resellable,
          BigInt(eventEndTimestamp),
          BigInt(earlySaleTimestamp),
          BigInt(publicSaleTimestamp),
          formData.enablePOAP,
        ],
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Check console for details.');
    }
  };

  if (isSuccess && !formData.enablePrioritySeats) {
    setTimeout(() => router.push('/'), 2000);
  }

  if (isSuccess && formData.enablePrioritySeats && prioritySeatsDone) {
    setTimeout(() => router.push('/'), 2000);
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Please Connect Your Wallet</h1>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Events</Link>
          <ConnectButton />
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          🎪 Create New Event
        </h1>

        {isSuccess ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">✅ Event Created Successfully!</h2>
            {settingPrioritySeats && (
              <p className="text-yellow-300 mb-2">⏳ Setting priority seats (1-10)...</p>
            )}
            {prioritySeatsDone && (
              <p className="text-green-300 mb-2">✅ Priority seats configured!</p>
            )}
            <p>Redirecting to home page...</p>
            <p className="text-sm text-gray-400 mt-4">
              Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash?.slice(0, 10)}...{hash?.slice(-8)}</a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="e.g., ETH Global Hackathon"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Ticket Price (ETH) *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="0 for free (gas only)"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Set to 0 for free tickets (buyers only pay gas)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Maximum Tickets *</label>
              <input
                type="number"
                min="1"
                value={formData.maxTickets}
                onChange={(e) => setFormData({ ...formData, maxTickets: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="e.g., 100"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date *</label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="e.g., Dec 25, 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Time *</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="e.g., 7:00 PM EST"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="e.g., New York Convention Center"
                required
              />
            </div>

            {/* Sale Times */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold mb-4">📅 Sale Schedule</h3>

              {/* Enable Early Bird Sale */}
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="enableEarlySale"
                  checked={formData.enableEarlySale}
                  onChange={(e) => setFormData({ ...formData, enableEarlySale: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enableEarlySale" className="text-sm">
                  🐦 Enable Early Bird Sale (Requires 5+ Badges)
                  <span className="block text-xs text-gray-400 mt-1">
                    Users with 5+ POAPs can buy tickets during early bird period
                  </span>
                </label>
              </div>

              {/* Early Bird Sale Time */}
              {formData.enableEarlySale && (
                <div className="grid md:grid-cols-2 gap-4 mb-4 bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Early Bird Sale Date (Year-Month-Day)</label>
                    <input
                      type="date"
                      value={formData.earlySaleDate}
                      onChange={(e) => setFormData({ ...formData, earlySaleDate: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Early Bird Sale Time</label>
                    <input
                      type="time"
                      value={formData.earlySaleTime}
                      onChange={(e) => setFormData({ ...formData, earlySaleTime: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* Public Sale Time */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Public Sale Date (Year-Month-Day) *</label>
                  <input
                    type="date"
                    value={formData.publicSaleDate}
                    onChange={(e) => setFormData({ ...formData, publicSaleDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Public Sale Time *</label>
                  <input
                    type="time"
                    value={formData.publicSaleTime}
                    onChange={(e) => setFormData({ ...formData, publicSaleTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              {/* Event End Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Event End Date (Year-Month-Day) *</label>
                  <input
                    type="date"
                    value={formData.eventEndDate}
                    onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Event End Time *</label>
                  <input
                    type="time"
                    value={formData.eventEndTime}
                    onChange={(e) => setFormData({ ...formData, eventEndTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Other Options */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold mb-4">⚙️ Additional Options</h3>

              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="resellable"
                  checked={formData.resellable}
                  onChange={(e) => setFormData({ ...formData, resellable: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="resellable" className="text-sm">
                  ♻️ Allow ticket resale on secondary market
                  <span className="block text-xs text-gray-400 mt-1">
                    You'll receive 5% royalty on all secondary sales
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="enablePOAP"
                  checked={formData.enablePOAP}
                  onChange={(e) => setFormData({ ...formData, enablePOAP: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enablePOAP" className="text-sm">
                  🎖️ Enable POAP (Proof of Attendance) Rewards
                  <span className="block text-xs text-gray-400 mt-1">
                    Attendees can claim a commemorative NFT badge after checking in
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enablePrioritySeats"
                  checked={formData.enablePrioritySeats}
                  onChange={(e) => setFormData({ ...formData, enablePrioritySeats: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enablePrioritySeats" className="text-sm">
                  ⭐ Set Seats 1-10 as Priority Seats (Requires 5+ POAPs)
                  <span className="block text-xs text-gray-400 mt-1">
                    These seats will require 5+ POAP badges to purchase, even during public sale
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 font-bold py-4 rounded-lg text-xl transition-all disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Creating Event...' : '🎪 Create Event'}
            </button>

            {hash && !isSuccess && (
              <p className="text-center text-sm text-gray-400">
                Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash.slice(0, 10)}...{hash.slice(-8)}</a>
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
