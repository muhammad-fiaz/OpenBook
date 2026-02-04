import { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "OpenBook Terms and Conditions - Rules and guidelines for using our platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground">
          <BookOpen className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>

        <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using OpenBook, you accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily access OpenBook for personal or commercial use. This is the grant
              of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose without authorization</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept
              responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Service Availability</h2>
            <p>
              We strive to provide uninterrupted service but do not guarantee that the service will be available at all
              times. We may suspend or terminate service for maintenance or other reasons.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Limitation of Liability</h2>
            <p>
              OpenBook shall not be liable for any damages arising out of the use or inability to use our service,
              including but not limited to data loss, profit loss, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service after changes
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, without regard to
              conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Contact Information</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@openbook.com" className="text-primary hover:underline">
                legal@openbook.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
