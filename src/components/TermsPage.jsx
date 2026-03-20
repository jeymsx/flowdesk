import { Link, useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-400 mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: March 19, 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using FlowDesk ("the Service"), you agree to be bound by these Terms &amp; Conditions
              ("Terms"). If you do not agree with any part of these Terms, you may not use the Service. These Terms
              apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>
              FlowDesk is a personal productivity web application that provides a customizable dashboard with
              widgets including a task manager, calendar, notes, focus timer, milestone tracker, and more.
              The Service is available via web browser and as an installable Progressive Web App (PWA).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">3. Accounts</h2>
            <p className="mb-3">
              To use certain features of the Service, you must create an account. You may register using an
              email address and password, or via Google OAuth. You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>Notifying us immediately of any unauthorized access or use of your account.</li>
              <li>Ensuring that the information you provide is accurate, current, and complete.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to terminate accounts that are found to be in violation of these Terms or
              used for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Violate any applicable local, national, or international law or regulation.</li>
              <li>Transmit any unsolicited or unauthorized advertising or promotional material.</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its related systems.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Upload or transmit viruses, malicious code, or any other harmful software.</li>
              <li>Collect or harvest any personally identifiable information from the Service without authorization.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">5. Your Content</h2>
            <p className="mb-3">
              You retain ownership of all content you create within the Service, including notes, tasks, events,
              and milestones ("Your Content"). By using the Service, you grant us a limited, non-exclusive,
              royalty-free license to store and process Your Content solely for the purpose of operating and
              providing the Service to you.
            </p>
            <p>
              You are solely responsible for Your Content and the consequences of storing it via the Service.
              We are not responsible for any loss, corruption, or unauthorized access to Your Content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">6. Data Security &amp; Encryption</h2>
            <p className="mb-3">
              Notes you create in FlowDesk are encrypted client-side using AES-256-GCM before being transmitted
              to our servers. The encryption key is derived from your unique user ID using PBKDF2, meaning the
              plaintext content of your notes is never sent to or stored on our servers in readable form.
            </p>
            <p>
              While we implement reasonable security measures to protect the Service and your data, no method of
              transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute
              security and will not be liable for unauthorized access resulting from circumstances beyond our
              reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its design, code, branding, and all content provided by FlowDesk (excluding
              Your Content), is the exclusive property of FlowDesk and is protected by applicable intellectual
              property laws. You may not copy, reproduce, distribute, modify, create derivative works of, or
              exploit any part of the Service without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">8. Third-Party Services</h2>
            <p className="mb-3">
              The Service integrates with third-party providers, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-gray-900 dark:text-white">Supabase</strong> — for authentication and database hosting.</li>
              <li><strong className="text-gray-900 dark:text-white">Google OAuth</strong> — as an optional sign-in method.</li>
              <li><strong className="text-gray-900 dark:text-white">Vercel</strong> — for hosting and deployment of the Service.</li>
            </ul>
            <p className="mt-3">
              Your use of these third-party services is subject to their respective terms of service and privacy
              policies. We are not responsible for the practices of any third-party providers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind,
              either express or implied, including but not limited to warranties of merchantability, fitness for a
              particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted,
              error-free, or completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, FlowDesk and its operators shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages, including but not limited
              to loss of data, loss of profits, or loss of goodwill arising out of or in connection with your use
              of or inability to use the Service. Our total liability to you for any claims arising from the use
              of the Service shall not exceed the amount you paid, if any, for access to the Service in the
              twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at our sole discretion,
              with or without notice, for any reason, including if we reasonably believe you have violated these
              Terms. Upon termination, your right to use the Service ceases immediately. You may delete your
              account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">12. Changes to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. We will indicate the date of the
              most recent revision at the top of this page. Continued use of the Service after any changes
              constitutes your acceptance of the revised Terms. We encourage you to review these Terms
              periodically.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard
              to conflict of law principles. Any disputes arising under these Terms shall be subject to the
              exclusive jurisdiction of the competent courts in the applicable jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">14. Contact</h2>
            <p>
              If you have any questions about these Terms, please reach out through the FlowDesk application or
              the contact information available on our website.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/privacy" className="hover:text-accent-500 transition-colors">Privacy Policy</Link>
          <Link to="/" className="hover:text-accent-500 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
