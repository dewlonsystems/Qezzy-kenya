// src/pages/MaintenancePage.tsx
import { useEffect } from 'react';

const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

const MaintenancePage = () => {
  // Optional: block back/forward navigation during maintenance
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <span className="text-2xl font-bold text-gray-800 lg:text-3xl">
              Qezzy<span className="text-amber-600">Kenya</span>
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.752 1.752 0 010 2.502c-.426 1.756-2.924 1.756-3.35 0a1.752 1.752 0 010-2.502zM12 12v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Scheduled Maintenance
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-4 leading-relaxed">
            We are currently performing scheduled maintenance. We highly recommend that you check back later.
          </p>

          <p className="text-gray-600 mb-4 leading-relaxed">
            All your tasks, payments, and earnings remain exactly as they are. Everything will resume normally once maintenance is complete.
          </p>

          <p className="text-gray-600 mb-6 leading-relaxed">
            We’re doing this to make your experience even better. We sincerely apologize for any inconvenience.
          </p>

          <p className="text-xs text-gray-500 italic">
            The site will be back shortly. You can refresh this page in a few minutes.
          </p>
        </div>
      </div>
    </>
  );
};

export default MaintenancePage;