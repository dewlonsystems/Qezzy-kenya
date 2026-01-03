// src/pages/JobsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { Job } from '../types';

const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs/');
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to load jobs:', err);
        // If user is inactive, backend returns 403 → redirect to activation
        alert('Your account is not active. Please activate to access jobs.');
        navigate('/activation');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <div className="absolute inset-0 bg-amber-50 rounded-tl-xl opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Jobs</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No jobs assigned yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Jobs will appear here once an administrator assigns them to you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="card">
                <div className="flex justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">{job.title}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{job.description}</p>
                <p className="text-xs text-gray-500 mt-3">
                  Assigned on: {new Date(job.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;