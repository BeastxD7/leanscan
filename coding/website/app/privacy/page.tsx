import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LeanScan handles your data. Plain-English privacy policy for our waitlist and app.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "May 20, 2026";

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <nav className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link
            href="/"
            className="serif text-xl font-semibold text-forest tracking-tight"
          >
            <span className="inline-block w-2 h-2 bg-amber rounded-full mr-2 align-middle" />
            LeanScan
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16 prose-content">
        <p className="text-sm text-muted uppercase tracking-widest mb-3">
          Privacy Policy
        </p>
        <h1 className="serif text-4xl md:text-5xl font-medium text-forest tracking-tight mb-4">
          Plain-English privacy.
        </h1>
        <p className="text-muted mb-12">Last updated: {LAST_UPDATED}</p>

        <Section title="What we collect">
          <p>
            For the waitlist: <strong>only your email address</strong>. Nothing
            else. We don&apos;t collect your name, IP, location, or browsing
            behavior on this site.
          </p>
          <p>
            Once the app launches, the LeanScan mobile app will collect food
            photos, weight logs, training data, and other health information
            you choose to log. That&apos;s covered by a separate in-app privacy
            policy you&apos;ll agree to when you sign up.
          </p>
        </Section>

        <Section title="Why we collect it">
          <ul>
            <li>To email you when LeanScan opens for early access.</li>
            <li>To offer you the founder cohort price ($39/year for life).</li>
            <li>
              That&apos;s it. We do not sell, rent, share, or advertise to
              your email.
            </li>
          </ul>
        </Section>

        <Section title="Where it lives">
          <p>
            Your email is stored with our hosting provider in the EU/US.
            Encrypted at rest and in transit. We send transactional emails
            through a third-party email provider (currently being selected —
            we&apos;ll update this when it&apos;s wired up).
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Until you ask us to delete it, or until two years after public
            launch — whichever comes first.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You have the right to access, correct, delete, or export your data
            at any time. Send a one-line email to{" "}
            <a
              href="mailto:hello@leanscan.app"
              className="text-forest underline"
            >
              hello@leanscan.app
            </a>{" "}
            and we&apos;ll process it within 30 days. No questions, no friction.
          </p>
          <p>
            If you&apos;re in the EU/UK, this is covered under GDPR. If
            you&apos;re in California, under CCPA. Either way: same answer,
            email us.
          </p>
        </Section>

        <Section title="Cookies / tracking">
          <p>
            We don&apos;t set tracking cookies on this site. We may add
            privacy-respecting analytics (Plausible or similar) before public
            launch — we&apos;ll update this page when we do.
          </p>
        </Section>

        <Section title="Children">
          <p>
            LeanScan is not directed at children under 16. We don&apos;t
            knowingly collect data from anyone under 16.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We&apos;ll update this page when our practices change. Material
            changes get emailed to subscribers. The &quot;last updated&quot;
            date at the top reflects the most recent revision.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, deletion requests, anything else:{" "}
            <a
              href="mailto:hello@leanscan.app"
              className="text-forest underline"
            >
              hello@leanscan.app
            </a>
          </p>
        </Section>

        <p className="text-sm text-muted mt-16 border-t border-line pt-8">
          This is a plain-English summary written by an indie founder, not a
          lawyer. Before any commercial launch, it should be reviewed by
          counsel for the jurisdictions where users sign up.
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="serif text-2xl font-medium text-forest tracking-tight mb-4">
        {title}
      </h2>
      <div className="text-charcoal leading-relaxed space-y-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2">
        {children}
      </div>
    </section>
  );
}
