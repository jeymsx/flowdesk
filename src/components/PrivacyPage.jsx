import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-400 mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to FlowDesk
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: March 19, 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-gray-700 dark:text-gray-300">

          <section>
            <p>
              FlowDesk ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use the FlowDesk
              web application and related services (collectively, the "Service"). Please read this policy
              carefully. By using the Service, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">1. Information We Collect</h2>

            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">1.1 Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-gray-900 dark:text-white">Account information:</strong> When you register, we collect your email address and a hashed password (if using email/password sign-up), or your Google account profile information (name, email, profile picture) if you sign in with Google.</li>
              <li><strong className="text-gray-900 dark:text-white">Profile data:</strong> An optional display username you choose within the app.</li>
              <li><strong className="text-gray-900 dark:text-white">Productivity data:</strong> Tasks, calendar events, milestones, and focus session preferences you create within the Service. These are stored in our database associated with your account.</li>
              <li><strong className="text-gray-900 dark:text-white">Notes:</strong> Notes you write are encrypted on your device before transmission. We store only the encrypted ciphertext — the plaintext content of your notes is never accessible to us.</li>
            </ul>

            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">1.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-gray-900 dark:text-white">Usage data:</strong> General interaction data such as pages visited and features used, collected via our hosting provider (Vercel) for performance and error monitoring.</li>
              <li><strong className="text-gray-900 dark:text-white">Device &amp; browser data:</strong> Browser type, operating system, screen resolution, and device type, used to ensure compatibility and improve the Service.</li>
              <li><strong className="text-gray-900 dark:text-white">Log data:</strong> IP address, timestamps, and request logs retained by Vercel and Supabase as part of standard infrastructure operation.</li>
            </ul>

            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">1.3 Local Storage</h3>
            <p>
              The Service uses your browser's <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">localStorage</code> to persist UI preferences such as dark mode, widget layout, and accent color. This data never leaves your device and is not transmitted to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, operate, and maintain the Service.</li>
              <li>Authenticate your identity and manage your account.</li>
              <li>Sync your productivity data (tasks, events, milestones) across your devices.</li>
              <li>Respond to support requests or inquiries.</li>
              <li>Monitor for abuse, fraud, or violations of our Terms &amp; Conditions.</li>
              <li>Analyze usage patterns to improve the Service (in aggregate, non-identifiable form).</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">3. Notes Encryption</h2>
            <p className="mb-3">
              Notes are encrypted client-side using AES-256-GCM encryption before leaving your browser. The
              encryption key is derived from your unique user ID using PBKDF2 (100,000 iterations, SHA-256).
              This means:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The plaintext content of your notes is never transmitted to or stored on our servers.</li>
              <li>We cannot read, access, or recover the content of your notes.</li>
              <li>Your notes are accessible on any device you log into — no separate key export or import is required.</li>
              <li>If you delete your account, your encrypted notes are deleted and the content is permanently unrecoverable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">
              We use the following third-party services to operate FlowDesk. Each service processes your data
              according to its own privacy policy.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Supabase</p>
                <p>
                  Provides our authentication system (email/password, Google OAuth) and PostgreSQL database hosting.
                  Your account credentials and productivity data are stored on Supabase infrastructure.
                  Supabase is SOC 2 Type II certified and stores data in secure, redundant cloud infrastructure.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Google OAuth</p>
                <p>
                  If you choose to sign in with Google, Google shares your name, email address, and profile
                  picture with us for the purpose of creating and authenticating your FlowDesk account. We do
                  not receive your Google password or access to any other Google services.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Vercel</p>
                <p>
                  Hosts and serves the FlowDesk web application. Vercel may collect standard web server logs
                  including IP addresses and request metadata as part of normal CDN and infrastructure operation.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your account information and productivity data for as long as your account is active.
              If you delete your account, we will delete your data from our active systems. Residual copies may
              remain in backups for a limited period before being permanently purged, in accordance with our
              data retention schedules.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">6. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-gray-900 dark:text-white">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-gray-900 dark:text-white">Correction:</strong> Request that we correct inaccurate or incomplete data.</li>
              <li><strong className="text-gray-900 dark:text-white">Deletion:</strong> Request deletion of your account and associated data.</li>
              <li><strong className="text-gray-900 dark:text-white">Portability:</strong> Request your data in a portable, machine-readable format.</li>
              <li><strong className="text-gray-900 dark:text-white">Objection:</strong> Object to certain types of processing of your data.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us through the FlowDesk application or via the
              contact information on our website. We will respond to requests within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">7. Cookies &amp; Local Storage</h2>
            <p className="mb-3">
              FlowDesk does not use tracking cookies or advertising cookies. We use:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-gray-900 dark:text-white">Authentication tokens:</strong> Stored securely by Supabase in your browser to keep you logged in across sessions.</li>
              <li><strong className="text-gray-900 dark:text-white">Preference storage:</strong> UI preferences (dark mode, layout, accent color) stored in <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">localStorage</code> on your device only.</li>
            </ul>
            <p className="mt-3">
              You can clear localStorage and session cookies via your browser settings at any time, which will
              sign you out and reset your UI preferences.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">8. Children's Privacy</h2>
            <p>
              FlowDesk is not directed to children under the age of 13 (or 16 in certain jurisdictions). We do
              not knowingly collect personal information from children. If you believe a child has provided us
              with personal information, please contact us and we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">9. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption for all data in
              transit, client-side encryption for notes, and access controls on our database. However, no
              system is completely secure. We encourage you to use a strong, unique password for your FlowDesk
              account and to keep your device secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will update the "Last updated" date at
              the top of this page. Your continued use of the Service after any changes indicates your acceptance
              of the updated policy. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests related to this Privacy Policy, please contact us
              through the FlowDesk application or the contact information available on our website.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <footer className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            <Link to="/" className="hover:text-accent-500 transition-colors">Home</Link>
            <span>•</span>
            <Link to="/changelog" className="hover:text-accent-500 transition-colors">Changelog</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-accent-500 transition-colors">FAQ</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-accent-500 transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-accent-500 transition-colors">Privacy</Link>
          </nav>
          <p className="mt-6 text-[10px] font-medium text-gray-300 dark:text-gray-700 uppercase tracking-[0.2em]">
            © 2026 FlowDesk · Built for focus
          </p>
        </footer>
      </div>
    </div>
  );
}
