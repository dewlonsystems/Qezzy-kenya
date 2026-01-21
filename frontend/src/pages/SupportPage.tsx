// src/pages/SupportPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { SupportTicket } from '../types';

// ====== TYPED SVG ICONS ======
const ArrowLeftIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const MessageCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const SendIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ClockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ChevronRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const WalletIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TaskIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const UserIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ShieldIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const HelpCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9 a3 3 0 0 1 5.83 1 c0 2 -3 3 -3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SupportPage = () => {
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState<number | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState(''); 
  const [openingTicketId, setOpeningTicketId] = useState<number | null>(null);

  // 🔹 NEW: WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
  });

  const categories = [
    { value: 'activation', label: 'Account Activation', icon: ShieldIcon, color: 'red' },
    { value: 'payment', label: 'Payment Issue', icon: WalletIcon, color: 'emerald' },
    { value: 'withdrawal', label: 'Withdrawal Problem', icon: WalletIcon, color: 'emerald' },
    { value: 'referral', label: 'Referral Issue', icon: UserIcon, color: 'blue' },
    { value: 'job', label: 'Job Related', icon: TaskIcon, color: 'amber' },
    { value: 'technical', label: 'Technical Issue', icon: HelpCircleIcon, color: 'purple' },
    { value: 'other', label: 'Other', icon: HelpCircleIcon, color: 'purple' },
  ];

  // Load tickets
  useEffect(() => {
    const loadTickets = async () => {
      setLoadingTickets(true);
      setMessage('');
      try {
        const res = await api.get('/support/tickets/');
        setTickets(res.data.tickets || []);
      } catch (err) {
        console.error('Failed to load tickets:', err);
        setMessage('Failed to load tickets.');
      } finally {
        setLoadingTickets(false);
      }
    };
    loadTickets();
  }, []);

  // 🔹 NEW: Real-time WebSocket connection
  useEffect(() => {
    if (activeTicket === null) return;

    let ws: WebSocket | null = null;

    const connectWebSocket = async () => {
      try {
        // Get Firebase ID token
        const token = await (window as any).auth.currentUser.getIdToken();
        const API_URL = import.meta.env.VITE_API_URL || 'https://api.qezzykenya.company';
        const wsUrl = `${API_URL.replace('http', 'ws')}/ws/support/?token=${token}`;
        
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected for support');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.error) {
            setMessage(data.error);
            return;
          }

          // Only update if it's a new message
          if (data.id && data.message) {
            setTickets(prev => prev.map(ticket => {
              if (ticket.ticket_id === activeTicket) {
                return {
                  ...ticket,
                  messages: [...(ticket.messages || []), {
                    id: data.id,
                    sender: data.is_admin ? 'Support Team' : 'You',
                    message: data.message,
                    created_at: data.created_at,
                  }]
                };
              }
              return ticket;
            }));
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Optional: auto-reconnect logic can go here
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          setMessage('Connection error. Messages may be delayed.');
        };
      } catch (err) {
        console.error('Failed to get token for WebSocket:', err);
        setMessage('Authentication error. Please refresh.');
      }
    };

    connectWebSocket();

    // Cleanup on unmount or ticket change
    return () => {
      if (ws) {
        ws.close();
        wsRef.current = null;
      }
    };
  }, [activeTicket]);

  const loadTicketMessages = async (ticketId: number) => {
    setOpeningTicketId(ticketId);
    setMessage('');
    try {
      const res = await api.get(`/support/tickets/${ticketId}/`);
      setTickets(prev => prev.map(t => t.ticket_id === ticketId ? res.data : t));
      setActiveTicket(ticketId);
    } catch (err: any) {
      console.error('Failed to load ticket:', err);
      setMessage('Failed to open ticket.');
    } finally {
      setOpeningTicketId(null);
    }
  };

  const handleSubmitTicket = async () => {
    if (!formData.subject || !formData.message) {
      setMessage('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/support/tickets/create/', formData);
      setFormData({ subject: '', category: 'technical', message: '' });
      setShowNewTicket(false);
      const res = await api.get('/support/tickets/');
      setTickets(res.data.tickets || []);
    } catch (err: any) {
      setMessage('Failed to send message.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || activeTicket === null) return;

    // 🔹 NEW: Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: "send_message",
        ticket_id: activeTicket,
        message: newMessage,
      }));
      setNewMessage('');
      // Optimistic update
      setTickets(prev => prev.map(ticket => {
        if (ticket.ticket_id === activeTicket) {
          return {
            ...ticket,
            messages: [...(ticket.messages || []), {
              id: Date.now(), // temporary ID
              sender: 'You',
              message: newMessage,
              created_at: new Date().toISOString(),
            }]
          };
        }
        return ticket;
      }));
    } else {
      // Fallback to REST
      try {
        await api.post(`/support/tickets/${activeTicket}/`, { message: newMessage });
        setNewMessage('');
        loadTicketMessages(activeTicket);
      } catch (err) {
        setMessage('Failed to send reply.');
        console.error(err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            <ClockIcon className="w-4 h-4" />
            Open
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircleIcon className="w-4 h-4" />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            <CheckCircleIcon className="w-4 h-4" />
            Closed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            <AlertCircleIcon className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  const selectedTicket = tickets.find(t => t.ticket_id === activeTicket);

  useEffect(() => {
    document.title = 'Support - Qezzy Kenya';
  }, []);

  // ===== RENDER: TICKET CONVERSATION =====
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-inter">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <button
              onClick={() => {
                setActiveTicket(null);
                // Close WebSocket when leaving
                if (wsRef.current) wsRef.current.close();
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" />
              <span className="text-sm">Back to tickets</span>
            </button>
            <div>
              {getStatusBadge(selectedTicket.status)}
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedTicket.subject}</h2>
          <p className="text-sm text-gray-600 mb-6">
            {categories.find(c => c.value === selectedTicket.category)?.label}
          </p>

          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pb-4">
            {selectedTicket.messages?.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No messages yet.</p>
            ) : (
              selectedTicket.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'You' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender === 'You' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}
                  >
                    {msg.sender === 'You' ? (
                      <UserIcon className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ShieldIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.sender === 'You' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl ${
                        msg.sender === 'You'
                          ? 'bg-amber-100 text-amber-800 rounded-tr-none'
                          : 'bg-blue-100 text-blue-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {new Date(msg.created_at).toLocaleString('en-KE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Input */}
          {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <input
                type="text"
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSendReply}
                disabled={!newMessage.trim()}
                className={`p-3 rounded-xl ${
                  newMessage.trim()
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {message && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== RENDER: MAIN SUPPORT PAGE =====
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-inter">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >            
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> 
              <span>Back</span>
          </button>

          <h1 className="text-xl font-bold text-gray-800">Support</h1>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-center">
            {message}
          </div>
        )}

        {/* Help Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <MessageCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How can we help?</h2>
              <p className="text-white/90 text-sm">We typically respond within 2 hours</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewTicket(true)}
            className="w-full mt-3 py-2.5 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-colors text-sm"
          >
            <div className="flex items-center justify-center gap-1.5">
              <PlusIcon className="w-4 h-4" />
              Create New Ticket
            </div>
          </button>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Issues</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setShowNewTicket(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${
                    cat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    cat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                    cat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                    cat.color === 'red' ? 'bg-red-100 text-red-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* My Tickets */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-3">
            Your Tickets
          </h2>

          {loadingTickets ? (
            <div className="text-center py-6 text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading...
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4">
                <MessageCircleIcon className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-gray-600 text-sm">No support tickets yet</p>
              <p className="text-xs text-gray-500 mt-1">Create one if you need help</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.ticket_id}
                  onClick={() => loadTicketMessages(ticket.ticket_id)}
                  disabled={openingTicketId === ticket.ticket_id}
                  className={`w-full bg-white rounded-2xl border border-gray-200 p-4 text-left transition-colors ${
                    openingTicketId === ticket.ticket_id
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-mono">
                          TKT-{ticket.ticket_id.toString().padStart(3, '0')}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="font-medium text-gray-800 text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {categories.find(c => c.value === ticket.category)?.label}
                      </p>
                    </div>
                    {openingTicketId === ticket.ticket_id ? (
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">FAQ</h2>
          <div className="space-y-3">
            {[
              { q: 'How do I withdraw?', a: 'Go to Wallet > Withdraw. M-Pesa is instant.' },
              { q: 'Task rejected?', a: 'Check instructions and resubmit with corrections.' },
              { q: 'Referral bonus?', a: 'Earn KES 50 when a friend activates their account.' },
              { q: 'Main wallet withdrawal?', a: 'Available on the 5th of each month.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-medium text-gray-800 text-sm">{faq.q}</h3>
                <p className="text-xs text-gray-600 mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewTicket(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <button 
              onClick={() => setShowNewTicket(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-500">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4">New Support Ticket</h2>

            {message && (
              <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded-lg">
                {message}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief issue description"
                  className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Details..."
                  className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:outline-none resize-none"
                />
              </div>

              <button 
                onClick={handleSubmitTicket}
                disabled={submitting}
                className={`w-full py-2.5 text-sm font-semibold rounded-lg ${
                  submitting
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;