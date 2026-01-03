// src/pages/PrivacyPolicy.tsx
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

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: July 2025</p>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to <strong>Qezzy Kenya</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform to complete tasks, earn money, and manage your account.
              </p>
              <p className="leading-relaxed mt-3">
                By using Qezzy Kenya, you agree to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">We collect the following types of information:</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Name, email address, and phone number</li>
                    <li>Referral code (if applicable)</li>
                    <li>Profile details (skills, address, town, ZIP code)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Payment Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>M-Pesa phone number</li>
                    <li>Bank name, branch, and account number (if provided)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Task & Activity Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Tasks you complete or submit</li>
                    <li>Submission timestamps and content</li>
                    <li>Earnings and withdrawal history</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Technical Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Device information and IP address</li>
                    <li>Browser type and usage patterns</li>
                    <li>Authentication logs (via Firebase)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Authenticate your identity and manage your account</li>
                <li>Assign, track, and verify task completions</li>
                <li>Process payments and withdrawals via M-Pesa or bank transfer</li>
                <li>Manage your referral program participation</li>
                <li>Respond to support requests and improve our services</li>
                <li>Comply with Kenyan financial regulations and tax requirements</li>
                <li>Detect and prevent fraud, abuse, or unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Information Sharing</h2>
              <p className="leading-relaxed mb-3">
                We do not sell or rent your personal information. We may share it only in these cases:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <strong>With your consent</strong>: e.g., when you submit a task that requires sharing data with a partner
                </li>
                <li>
                  <strong>Service providers</strong>: Firebase (authentication), Safaricom (M-Pesa Daraja API), and Supabase (database)
                </li>
                <li>
                  <strong>Legal compliance</strong>: To meet obligations under Kenyan law, including AML and tax reporting
                </li>
                <li>
                  <strong>Business transfers</strong>: In the event of a merger, acquisition, or asset sale
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
                <li>Encryption of data in transit (HTTPS) and at rest</li>
                <li>Secure authentication via Firebase</li>
                <li>Regular security audits and access controls</li>
              </ul>
              <p className="leading-relaxed mt-3">
                While we strive to protect your information, no internet transmission is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
              <p className="leading-relaxed mb-3">Under Kenyan data protection laws, you have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Access and receive a copy of your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your account and data (subject to legal retention requirements)</li>
                <li>Withdraw consent (e.g., for marketing)</li>
                <li>File a complaint with the Office of the Data Protection Commissioner (ODPC)</li>
              </ul>
              <p className="leading-relaxed mt-3">
                To exercise these rights, contact us at the email below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Policy Updates</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
                The “Last updated” date will be revised, and continued use of Qezzy Kenya constitutes acceptance of the changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Us</h2>
              <p className="leading-relaxed">
                For questions about this Privacy Policy or to exercise your rights, contact our Data Protection Officer at{' '}
                <a 
                  href="mailto:privacy@qezzy.co.ke" 
                  className="text-amber-600 hover:text-amber-700 underline font-medium"
                >
                  privacy@qezzy.co.ke
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

export default PrivacyPolicy;