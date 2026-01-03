// src/pages/SupportPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { SupportTicket, SupportMessage } from '../types';

// Google Fonts: Inter
const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

// Lucide-style SVG Icons
const MessageSquareIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ClockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const UserIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const HeadphonesIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M3 11h18M7 21l4-7 4 7M9.5 16h5" />
  </svg>
);

const ChevronRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PlusIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SupportPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'new' | 'thread'>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const categories = [
    { value: 'activation', label: 'Account Activation' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'withdrawal', label: 'Withdrawal Problem' },
    { value: 'referral', label: 'Referral Issue' },
    { value: 'job', label: 'Job Related' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch tickets
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get('/support/tickets/');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Load ticket messages
  const loadTicketMessages = async (ticketId: number) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/support/tickets/${ticketId}/`);
      setSelectedTicket(res.data);
      setMessages(res.data.messages || []);
      setView('thread');
    } catch (err: any) {
      console.error('Failed to load ticket:', err);
      alert('Failed to open ticket. It may not exist or belong to you.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Create new ticket
  const handleSubmitTicket = async () => {
    if (!formData.subject || !formData.message) {
      alert('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support/tickets/create/', formData);
      setSubmitSuccess(true);
      setFormData({ subject: '', category: 'technical', message: '' });
      loadTickets();
    } catch (err: any) {
      alert('Failed to send message. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await api.post(`/support/tickets/${selectedTicket.ticket_id}/`, { message: newMessage });
      setNewMessage('');
      loadTicketMessages(selectedTicket.ticket_id);
    } catch (err) {
      alert('Failed to send reply. Please try again.');
      console.error(err);
    }
  };

  // Status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return { icon: AlertCircleIcon, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Open' };
      case 'resolved':
        return { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Resolved' };
      case 'closed':
        return { icon: CheckCircleIcon, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Closed' };
      default:
        return { icon: ClockIcon, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Pending' };
    }
  };

  // ===== SUCCESS VIEW =====
  if (submitSuccess) {
    return (
      <>
        <InterFontLink />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-800">Message Sent!</h2>
            <p className="text-gray-600 mt-2">
              Our support team will get back to you soon.
            </p>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setView('list');
                loadTickets();
              }}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              View My Tickets
            </button>
          </div>
        </div>
      </>
    );
  }

  // ===== THREAD VIEW =====
  if (view === 'thread' && selectedTicket) {
    const statusConfig = getStatusConfig(selectedTicket.status);
    return (
      <>
        <InterFontLink />
        <div className="min-h-screen bg-gray-50 font-sans">
          <div className="max-w-md mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ChevronRightIcon className="w-4 h-4 rotate-180" />
                <span className="text-sm">Back to tickets</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                <statusConfig.icon className="w-4 h-4 text-amber-600" />
                {statusConfig.label}
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedTicket.subject}</h2>
            <p className="text-sm text-gray-600 mb-6">
              {categories.find(c => c.value === selectedTicket.category)?.label} •{' '}
              {new Date(selectedTicket.created_at).toLocaleDateString('en-KE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pb-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center py-6 text-gray-500">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading messages...
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        msg.sender === 'user' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <UserIcon className="w-4 h-4 text-amber-600" />
                      ) : (
                        <HeadphonesIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block p-4 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-amber-100 text-amber-800 rounded-tr-none'
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
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
              ) : (
                <p className="text-center text-gray-500 py-4">No messages yet.</p>
              )}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'closed' && (
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
          </div>
        </div>
      </>
    );
  }

  // ===== NEW TICKET VIEW =====
  if (view === 'new') {
    return (
      <>
        <InterFontLink />
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ChevronRightIcon className="w-4 h-4 rotate-180" />
                <span className="text-sm">Back to support</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800">New Ticket</h1>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none appearance-none bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                      <ChevronRightIcon className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="text-sm font-medium text-gray-700 block mb-1">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-sm font-medium text-gray-700 block mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Describe your issue in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitTicket}
                  disabled={submitting}
                  className={`w-full py-3 px-4 font-semibold rounded-xl shadow-sm transition-all ${
                    submitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4 mr-2 inline" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Help Tip */}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl">
              <div className="flex items-start gap-3">
                <MessageSquareIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Need immediate help?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Check our FAQ or contact us via WhatsApp for urgent matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== TICKET LIST VIEW =====
  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-800">Support</h1>
          </div>

          {/* New Ticket Button */}
          <button
            onClick={() => setView('new')}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all mb-6 flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Ticket
          </button>

          {/* Tickets List */}
          <div>
            <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-3">
              Your Tickets
            </h2>

            {loadingTickets ? (
              <div className="text-center py-8 text-gray-500">
                Loading your tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4">
                  <MessageSquareIcon className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-gray-600">No support tickets yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a ticket if you need help
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  return (
                    <button
                      key={ticket.ticket_id}
                      onClick={() => loadTicketMessages(ticket.ticket_id)}
                      className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 font-mono">
                              TKT-{ticket.ticket_id.toString().padStart(3, '0')}
                            </span>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusConfig.bg}`}>
                              <statusConfig.icon className={`w-3 h-3 ${statusConfig.color}`} />
                              <span className={`text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {categories.find(c => c.value === ticket.category)?.label} •{' '}
                            {new Date(ticket.created_at).toLocaleDateString('en-KE', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportPage;