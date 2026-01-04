// src/pages/SupportPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { SupportTicket } from '../types';

// ====== SVG ICONS ======
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const MessageCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Category Icons
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ✅ NOW USED FOR "Account Activation"
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const HelpCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SupportPage = () => {
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState<number | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [message, setMessage] = useState(''); // ✅ Now used for error/success messages
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false); // ✅ Kept and used

  // Form state for new ticket
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
  });

  // Real categories — now using ShieldIcon for activation
  const categories = [
    { value: 'activation', label: 'Account Activation', icon: ShieldIcon, color: 'red' },
    { value: 'payment', label: 'Payment Issue', icon: WalletIcon, color: 'emerald' },
    { value: 'withdrawal', label: 'Withdrawal Problem', icon: WalletIcon, color: 'emerald' },
    { value: 'referral', label: 'Referral Issue', icon: UserIcon, color: 'blue' },
    { value: 'job', label: 'Job Related', icon: TaskIcon, color: 'amber' },
    { value: 'technical', label: 'Technical Issue', icon: HelpCircleIcon, color: 'purple' },
    { value: 'other', label: 'Other', icon: HelpCircleIcon, color: 'purple' },
  ];

  // Load tickets on mount
  useEffect(() => {
    const loadTickets = async () => {
      setLoadingTickets(true);
      setMessage('');
      try {
        const res = await api.get('/support/tickets/');
        setTickets(res.data.tickets || []);
      } catch (err) {
        console.error('Failed to load tickets:', err);
        setMessage('Failed to load tickets. Please try again.');
      } finally {
        setLoadingTickets(false);
      }
    };
    loadTickets();
  }, []);

  // Load ticket messages
  const loadTicketMessages = async (ticketId: number) => {
    setLoadingMessages(true);
    setMessage('');
    try {
      const res = await api.get(`/support/tickets/${ticketId}/`);
      setTickets(prev => prev.map(t => t.ticket_id === ticketId ? res.data : t));
      setActiveTicket(ticketId);
    } catch (err: any) {
      console.error('Failed to load ticket:', err);
      setMessage('Failed to open ticket. It may not exist or belong to you.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Create new ticket
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
      setMessage(''); // Clear on success
      // Refresh tickets list
      const res = await api.get('/support/tickets/');
      setTickets(res.data.tickets || []);
    } catch (err: any) {
      setMessage('Failed to send message. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!newMessage.trim() || activeTicket === null) return;
    const ticket = tickets.find(t => t.ticket_id === activeTicket);
    if (!ticket) return;
    
    try {
      await api.post(`/support/tickets/${activeTicket}/`, { message: newMessage });
      setNewMessage('');
      loadTicketMessages(activeTicket);
    } catch (err) {
      setMessage('Failed to send reply. Please try again.');
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            <ClockIcon />
            Open
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircleIcon />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            <CheckCircleIcon />
            Closed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            <AlertCircleIcon />
            Pending
          </span>
        );
    }
  };

  const selectedTicket = tickets.find(t => t.ticket_id === activeTicket);

  useEffect(() => {
    document.title = 'Support - Qezzy Kenya';
  }, []);

  return (
    <div className="min-h-screen bg-landing-cream font-inter">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/overview')} 
                className="p-2 rounded-xl hover:bg-amber-50 transition-colors text-landing-text"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h1 className="text-xl font-bold text-landing-heading">Support</h1>
                <p className="text-sm text-landing-muted">We're here to help</p>
              </div>
            </div>
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-bold text-landing-heading hidden sm:block">Qezzy Kenya</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Help Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-3xl p-8 mb-8 animate-fade-in-up">
          <div className="absolute inset-0 bg-[url('image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full"></div>
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl">
                <MessageCircleIcon />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">How can we help you?</h2>
                <p className="text-white/80">Our support team typically responds within 2 hours</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNewTicket(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
            >
              <PlusIcon />
              Create New Ticket
            </button>
          </div>
        </div>

        {/* Global Message (error/success) */}
        {message && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center animate-fade-in-up">
            {message}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories & Tickets */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 border border-amber-100 animate-fade-in-up animation-delay-200">
              <h3 className="text-lg font-bold text-landing-heading mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setShowNewTicket(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        cat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        cat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                        cat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                        cat.color === 'red' ? 'bg-red-100 text-red-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <cat.icon />
                      </div>
                      <span className="text-sm font-medium text-landing-heading">{cat.label}</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                ))}
              </div>
            </div>

            {/* My Tickets */}
            <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden animate-fade-in-up animation-delay-400">
              <div className="p-4 border-b border-amber-100">
                <h3 className="font-bold text-landing-heading">My Tickets</h3>
              </div>
              <div className="divide-y divide-amber-50">
                {loadingTickets ? (
                  <div className="p-4 text-center text-landing-muted">
                    <div className="inline-block w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-4 text-center text-landing-muted">No tickets yet</div>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.ticket_id}
                      onClick={() => loadTicketMessages(ticket.ticket_id)}
                      className={`w-full p-4 text-left hover:bg-amber-50/50 transition-colors ${
                        activeTicket === ticket.ticket_id ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-landing-heading text-sm line-clamp-1">{ticket.subject}</p>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-landing-muted">
                        {categories.find(c => c.value === ticket.category)?.label}
                      </p>
                      <p className="text-xs text-landing-muted mt-1">
                        Updated {new Date(ticket.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ticket Detail / Conversation */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden h-[600px] flex flex-col animate-fade-in-up animation-delay-200">
                {/* Ticket Header */}
                <div className="p-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-landing-heading">{selectedTicket.subject}</h3>
                      <p className="text-sm text-landing-muted mt-1">
                        {categories.find(c => c.value === selectedTicket.category)?.label}
                      </p>
                    </div>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="inline-block w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : selectedTicket.messages?.length === 0 ? (
                    <div className="text-center text-landing-muted py-8">No messages yet.</div>
                  ) : (
                    selectedTicket.messages?.map((msg: any) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          msg.sender === 'user' 
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl rounded-br-md' 
                            : 'bg-gray-100 text-landing-heading rounded-2xl rounded-bl-md'
                        } p-4`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-2 ${
                            msg.sender === 'user' ? 'text-amber-100' : 'text-landing-muted'
                          }`}>
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
                  <div className="p-4 border-t border-amber-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-landing-heading placeholder:text-landing-muted focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                      />
                      <button 
                        onClick={handleSendReply}
                        disabled={!newMessage.trim()}
                        className={`p-3 rounded-xl ${
                          newMessage.trim()
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <SendIcon />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-amber-100 h-[600px] flex flex-col items-center justify-center text-center p-8 animate-fade-in-up animation-delay-200">
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                  <MessageCircleIcon />
                </div>
                <h3 className="text-xl font-bold text-landing-heading mb-2">Select a ticket</h3>
                <p className="text-landing-muted max-w-sm">
                  Choose a ticket from the list to view the conversation, or create a new ticket to get help from our support team.
                </p>
                <button 
                  onClick={() => setShowNewTicket(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all"
                >
                  <PlusIcon />
                  Create New Ticket
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 animate-fade-in-up animation-delay-600">
          <h2 className="text-2xl font-bold text-landing-heading text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: 'How do I withdraw my earnings?', a: 'Go to the Wallet page and click "Withdraw". Choose M-Pesa for instant transfers or bank transfer for 1-3 day processing.' },
              { q: 'Why was my task submission rejected?', a: 'Submissions may be rejected if instructions weren\'t followed correctly. Check the rejection reason and resubmit with corrections.' },
              { q: 'How does the referral program work?', a: 'Share your unique referral code. When someone signs up and activates their account, you earn KES 100 bonus.' },
              { q: 'When can I withdraw from the main wallet?', a: 'Main wallet withdrawals are available on the 5th of each month. Referral wallet can be withdrawn every 24 hours.' },
            ].map((faq, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 border border-amber-100 hover:shadow-lg transition-all duration-300"
              >
                <h4 className="font-bold text-landing-heading mb-2">{faq.q}</h4>
                <p className="text-sm text-landing-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewTicket(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-fade-in-up">
            <button 
              onClick={() => setShowNewTicket(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-amber-50 transition-colors text-landing-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-landing-heading mb-6">Create New Ticket</h2>

            {message && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {message}
              </div>
            )}

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-landing-heading mb-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-landing-heading focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-landing-heading mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-landing-heading placeholder:text-landing-muted focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-landing-heading mb-2">Message</label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-landing-heading placeholder:text-landing-muted focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit */}
              <button 
                onClick={handleSubmitTicket}
                disabled={submitting}
                className={`w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all flex items-center justify-center gap-2 ${
                  submitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <SendIcon />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;