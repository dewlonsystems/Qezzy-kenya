// src/pages/JobsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { Job } from '../types';
import LoadingSpinner from '../components/LoadingSpinner'; // ✅ NEW IMPORT

// Google Fonts: Inter
const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter  :wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

// Lucide-style SVG Icons (unchanged — kept for completeness)
const SearchIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const BriefcaseIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <path d="M2 12h20" />
  </svg>
);

const SendIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CheckCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const TrendingUpIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ClockIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true); // controls spinner visibility
  const [activeTab, setActiveTab] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs/');
        setJobs(res.data);
      } catch (err: any) {
        console.error('Failed to load jobs:', err);
        if (err.response?.status === 403) {
          alert('Your account is not active. Please activate to access jobs.');
          navigate('/activation');
        } else {
          alert('Failed to load jobs. Please try again.');
        }
      } finally {
        setLoading(false); // ✅ Hide spinner — even on error
      }
    };
    fetchJobs();
  }, [navigate]);

  // Rest of logic remains unchanged...
  const openJobs = jobs.filter(job => job.status === 'open');
  const submittedJobs = jobs.filter(job => job.status === 'submitted');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const declinedJobs = jobs.filter(job => job.status === 'declined');
  const totalEarned = completedJobs.reduce((sum, job) => sum + (job.reward || 0), 0);

  const getCurrentJobs = () => {
    switch (activeTab) {
      case 'open': return openJobs;
      case 'submitted': return submittedJobs;
      case 'completed': return completedJobs;
      case 'declined': return declinedJobs;
      default: return [];
    }
  };

  const filteredJobs = getCurrentJobs().filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'declined': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabConfig = [
    { value: 'open', label: 'Open', icon: BriefcaseIcon, count: openJobs.length },
    { value: 'submitted', label: 'Submitted', icon: SendIcon, count: submittedJobs.length },
    { value: 'completed', label: 'Completed', icon: CheckCircleIcon, count: completedJobs.length },
    { value: 'declined', label: 'Declined', icon: XCircleIcon, count: declinedJobs.length },
  ];

  // ✅ Show branded spinner during initial load
  if (loading) {
    return <LoadingSpinner message="Fetching available jobs..." />;
  }

  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
              <p className="text-gray-600">Complete tasks and earn money</p>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
              <TrendingUpIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Total Earned</p>
                <p className="font-semibold text-green-700">KES {totalEarned.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700">
              <FilterIcon className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-1 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {tabConfig.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl transition-colors ${
                    activeTab === tab.value
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.value ? 'text-amber-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className="bg-gray-200 text-gray-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">{job.title}</h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{job.description}</p>
                      {job.reward && (
                        <p className="text-sm font-semibold text-amber-600 mt-2">KES {job.reward.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <span>Assigned: {new Date(job.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                {tabConfig.find(t => t.value === activeTab)?.icon({ className: "w-8 h-8 text-gray-400" })}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                No {tabConfig.find(t => t.value === activeTab)?.label.toLowerCase()} jobs
              </h3>
              <p className="text-sm text-gray-600">
                {activeTab === 'open'
                  ? "Check back soon for new opportunities"
                  : `You don't have any ${tabConfig.find(t => t.value === activeTab)?.label.toLowerCase()} jobs yet`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JobsPage;