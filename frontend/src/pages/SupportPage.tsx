// src/pages/SupportPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { SupportTicket, SupportMessage } from '../types';

type Tab = 'submit' | 'tickets';

const SupportPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('submit');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false); // Now used in render!

  // Form state for new ticket
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const categories = [
    { value: 'activation', label: 'Account Activation' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'withdrawal', label: 'Withdrawal Problem' },
    { value: 'referral', label: 'Referral Issue' },
    { value: 'job', label: 'Job Related' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch tickets when switching to 'tickets' tab
  useEffect(() => {
    if (activeTab === 'tickets' && tickets.length === 0) {
      loadTickets();
    }
  }, [activeTab]);

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

  const loadTicketMessages = async (ticketId: number) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/support/tickets/${ticketId}/`);
      setSelectedTicket(res.data);
      setMessages(res.data.messages || []);
    } catch (err: any) {
      console.error('Failed to load ticket:', err);
      alert('Failed to open ticket. It may not exist or belong to you.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/support/tickets/create/', formData);
      setSubmitSuccess(true);
      setFormData({ subject: '', category: 'technical', message: '' });
      // Refresh tickets list
      loadTickets();
    } catch (err: any) {
      alert('Failed to send message. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: number, replyText: string) => {
    if (!replyText.trim()) return;
    
    try {
      await api.post(`/support/tickets/${ticketId}/`, { message: replyText });
      // Refresh messages
      loadTicketMessages(ticketId);
    } catch (err) {
      alert('Failed to send reply. Please try again.');
      console.error(err);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-app p-4">
        <div className="max-w-md mx-auto">
          <div className="card text-center py-8">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-800">Message Sent!</h2>
            <p className="text-gray-600 mt-2">
              Our support team will get back to you soon.
            </p>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setActiveTab('tickets');
                loadTickets();
              }}
              className="btn-primary mt-4"
            >
              View My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-app p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            >
              ← Back to Tickets
            </button>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
              selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
            </span>
          </div>

          <div className="card">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedTicket.subject}</h2>
              <p className="text-sm text-gray-600">
                {categories.find(c => c.value === selectedTicket.category)?.label}
                {' • '}
                {new Date(selectedTicket.created_at).toLocaleString()}
              </p>
            </div>

            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {loadingMessages ? (
                <div className="flex justify-center items-center py-6 text-gray-500">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading messages...
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-amber-50 ml-8 border-l-4 border-amber-500'
                        : 'bg-gray-50 mr-8 border-l-4 border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{msg.sender === 'user' ? 'You' : 'Support Team'}</span>
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-800">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No messages yet.</p>
              )}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== 'closed' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
                  if (textarea.value.trim()) {
                    handleReply(selectedTicket.ticket_id, textarea.value);
                    textarea.value = '';
                  }
                }}
                className="flex gap-2"
              >
                <textarea
                  placeholder="Type your reply..."
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  rows={2}
                />
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Support</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`pb-2 px-4 font-medium ${
              activeTab === 'submit'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('submit')}
          >
            New Message
          </button>
          <button
            className={`pb-2 px-4 font-medium ${
              activeTab === 'tickets'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('tickets');
              if (tickets.length === 0) loadTickets();
            }}
          >
            My Tickets ({tickets.length})
          </button>
        </div>

        {activeTab === 'submit' ? (
          <div className="card">
            <p className="text-gray-600 mb-6">
              Have an issue? Let us know and we’ll help you out.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`btn-primary w-full ${submitting ? 'opacity-75' : ''}`}
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            {loadingTickets ? (
              <div className="text-center py-8 text-gray-500">
                Loading your tickets...
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    onClick={() => loadTicketMessages(ticket.ticket_id)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-amber-50 cursor-pointer transition"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-800">{ticket.subject}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {categories.find(c => c.value === ticket.category)?.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                You haven’t submitted any support tickets yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;