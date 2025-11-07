'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import SellModal from '@/components/SellModal'; // Will be created later

interface Ticket {
  id: number;
  event_id: number;
  owner_address: string;
}

interface AuthState {
  token: string;
}

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const fetchTickets = async () => {
      const token = localStorage.getItem('nft-ticket-auth-token');
      if (!token) {
        setError('You are not authenticated.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/api/market/my-tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch tickets: ${res.statusText}`);
        }

        const data = await res.json();
        setTickets(data);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isConnected, router]);

  const handleSellClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };
  
  const handleListingSuccess = (ticketId: number) => {
    // Maybe refresh the list or update the UI to show the ticket is listed
    alert(`Ticket #${ticketId} has been listed for sale!`);
    handleCloseModal();
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Tickets</h1>
        
        {loading && <p>Loading your tickets...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <p>You do not own any tickets yet.</p>
        )}

        {!loading && tickets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-purple-400">Ticket #{ticket.id}</h2>
                <p className="text-gray-400 mt-2">For Event ID: {ticket.event_id}</p>
                <button
                  onClick={() => handleSellClick(ticket)}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Sell Ticket
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <SellModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onSuccess={handleListingSuccess}
        />
      )}
    </main>
  );
};

export default MyTicketsPage;
