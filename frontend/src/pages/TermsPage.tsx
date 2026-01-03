// src/pages/TermsOfService.tsx
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

const TermsOfService = () => {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: December 2024 </p>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using the <strong>Qezzy Kenya</strong> platform (the "Platform"), you agree to be legally bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you must not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Eligibility & Account Registration</h2>
              <p className="leading-relaxed mb-3">To use Qezzy Kenya, you must:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Be at least 18 years of age and a resident of Kenya</li>
                <li>Provide accurate, current, and complete registration information</li>
                <li>Complete the onboarding process, including profile and payment details</li>
                <li>Pay the one-time activation fee of <strong>KES 300</strong> via M-Pesa</li>
                <li>Maintain the confidentiality of your account credentials</li>
              </ul>
              <p className="leading-relaxed mt-3">
                We reserve the right to suspend accounts with inaccurate or misleading information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Account Activation</h2>
              <p className="leading-relaxed">
                Access to paid tasks and earnings requires payment of a one-time, non-refundable activation fee of <strong>KES 300</strong>. 
                This payment is processed securely via <strong>M-Pesa STK Push</strong>. 
                Users who do not activate their accounts will not be able to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>View or accept paid tasks</li>
                <li>Earn or withdraw money</li>
                <li>Access the referral program</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Tasks and Earnings</h2>
              <p className="leading-relaxed mb-3">By participating in tasks, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Complete tasks honestly, accurately, and in good faith</li>
                <li>Submit work that meets the specified quality standards</li>
                <li>Understand that earnings are credited only after task verification</li>
                <li>Acknowledge that Qezzy Kenya reserves the right to reject submissions for any reason, including low quality or policy violations</li>
                <li>Accept that fraudulent activity (e.g., bot usage, fake submissions) will result in immediate account termination and forfeiture of earnings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Withdrawals</h2>
              <p className="leading-relaxed mb-3">Withdrawal policies:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Main Wallet</strong>: Withdrawals processed on the <strong>5th of each month</strong> (Kenyan Time — EAT)</li>
                <li><strong>Referral Wallet</strong>: Withdrawals available <strong>once every 24 hours</strong></li>
                <li>Minimum withdrawal amount: <strong>KES 50</strong></li>
                <li><strong>M-Pesa withdrawals</strong>: Processed instantly</li>
                <li><strong>Bank withdrawals</strong>: Processed within <strong>3–5 business days</strong></li>
                <li>All withdrawal requests must be submitted through the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Referral Program</h2>
              <p className="leading-relaxed">
                Each user receives a unique referral code. You earn <strong>KES 100</strong> in your referral wallet for every referred user who:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Completes registration</li>
                <li>Pays the KES 300 activation fee</li>
                <li>Maintains an active account for at least 7 days</li>
              </ul>
              <p className="leading-relaxed mt-3">
                <strong>Prohibited activities</strong> include self-referrals, using multiple accounts, or incentivizing fake signups. 
                Violations will result in disqualification, forfeiture of referral earnings, and possible account termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Prohibited Activities</h2>
              <p className="leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Create more than one account</li>
                <li>Use bots, scripts, or automated tools to interact with the Platform</li>
                <li>Submit false, misleading, or plagiarized content</li>
                <li>Attempt to reverse-engineer, scrape, or hack our systems</li>
                <li>Engage in money laundering, fraud, or any illegal activity</li>
                <li>Harass or impersonate other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Account Termination</h2>
              <p className="leading-relaxed">
                We may suspend or terminate your account at any time for violations of these Terms. 
                You may also close your account via the Profile Settings page. 
                Upon termination:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>All pending tasks will be voided</li>
                <li>Earnings from fraudulent activity will be forfeited</li>
                <li>Legitimate earnings may be processed at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Limitation of Liability</h2>
              <p className="leading-relaxed">
                Qezzy Kenya provides the Platform "as is." To the fullest extent permitted by Kenyan law, we disclaim all warranties, express or implied. 
                Our total liability for any claim arising from your use of the Platform shall not exceed the amount you paid to us in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Changes to These Terms</h2>
              <p className="leading-relaxed">
                We may update these Terms periodically. Significant changes will be communicated via email or a notice on the Platform. 
                Your continued use after changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms are governed by the laws of the Republic of Kenya. Any disputes will be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
              <p className="leading-relaxed">
                For questions about these Terms of Service, contact our Legal Team at{" "}
                <a 
                  href="mailto:legal@qezzy.co.ke" 
                  className="text-amber-600 hover:text-amber-700 underline font-medium"
                >
                  legal@qezzy.co.ke
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

export default TermsOfService;