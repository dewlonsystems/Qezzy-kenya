// src/pages/CookiePolicy.tsx
import { Link } from 'react-router-dom';

// Google Fonts: Inter
const InterFontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

// Inline SVG Arrow
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const CookiePolicy = () => {
  return (
    <>
      <InterFontLink />
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-4xl mx-auto py-12">
          {/* Back Button */}
          <Link to="/" className="inline-block mb-8">
            <div className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <ArrowLeftIcon />
              <span className="text-sm font-medium">Back to Home</span>
            </div>
          </Link>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: July 2025</p>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. What Are Cookies</h2>
              <p className="leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience. 
                <strong>Qezzy Kenya</strong> uses cookies to enhance functionality, maintain your session, and provide a personalized experience while you complete tasks and manage earnings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-5 mt-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Essential Cookies</h3>
                  <p className="leading-relaxed text-gray-700">
                    These cookies are strictly necessary for the operation of our platform. They enable core functionality such as:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Authenticating your account (via Firebase)</li>
                    <li>Maintaining your session while you complete tasks</li>
                    <li>Processing M-Pesa STK push payments securely</li>
                    <li>Redirecting you after onboarding steps</li>
                  </ul>
                  <p className="mt-2 leading-relaxed text-gray-700">
                    You cannot disable these cookies without impairing essential features.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Functional Cookies</h3>
                  <p className="leading-relaxed text-gray-700">
                    These cookies remember your preferences to enhance your experience, such as:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Your language and regional settings (e.g., Kenyan Shillings)</li>
                    <li>Profile completion progress</li>
                    <li>Referral code associations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Analytics Cookies</h3>
                  <p className="leading-relaxed text-gray-700">
                    These cookies help us understand how users interact with our platform. We use anonymized data to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Track task completion rates</li>
                    <li>Measure referral program effectiveness</li>
                    <li>Identify usability issues</li>
                  </ul>
                  <p className="mt-2 leading-relaxed text-gray-700">
                    This data is never linked to your personal identity.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Third-Party Cookies</h2>
              <p className="leading-relaxed">
                We integrate with trusted third-party services that may set their own cookies:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li><strong>Firebase Authentication</strong>: For secure sign-in (Google and email)</li>
                <li><strong>M-Pesa Daraja API</strong>: For payment processing via STK Push</li>
                <li><strong>Supabase</strong>: For database operations and real-time data</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                These cookies are governed by the respective third parties’ privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Managing Cookies</h2>
              <p className="leading-relaxed mb-3">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Accept/Reject</strong>: Most browsers let you block or allow cookies</li>
                <li><strong>Delete</strong>: Remove stored cookies via browser settings</li>
                <li><strong>Private Mode</strong>: Use incognito/private browsing to avoid storage</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Note: Disabling essential cookies will prevent you from signing in, completing tasks, or receiving payments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookie Duration</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <strong>Session Cookies</strong>: Automatically deleted when you close your browser (e.g., auth tokens)
                </li>
                <li>
                  <strong>Persistent Cookies</strong>: Remain for a set period (e.g., referral codes, theme preferences) or until manually deleted
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Policy Updates</h2>
              <p className="leading-relaxed">
                We may update this Cookie Policy to reflect changes in our services, legal requirements, or technology. 
                The “Last updated” date at the top will always reflect the most recent revision. Continued use of Qezzy Kenya after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Us</h2>
              <p className="leading-relaxed">
                For questions about our cookie practices, contact us at{' '}
                <a 
                  href="mailto:info@qezzykenya.company" 
                  className="text-amber-600 hover:text-amber-700 underline font-medium"
                >
                  info@qezzykenya.company
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiePolicy;