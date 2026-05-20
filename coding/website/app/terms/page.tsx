import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for the LeanScan waitlist and early-access program.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "May 20, 2026";

export default function TermsPage() {
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

      <article className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm text-muted uppercase tracking-widest mb-3">
          Terms of Service
        </p>
        <h1 className="serif text-4xl md:text-5xl font-medium text-forest tracking-tight mb-4">
          The agreement, kept short.
        </h1>
        <p className="text-muted mb-12">Last updated: {LAST_UPDATED}</p>

        <Section title="Who we are">
          <p>
            LeanScan is an indie product. These terms govern your use of this
            website (leanscan.app) and your participation in our waitlist /
            early-access program.
          </p>
        </Section>

        <Section title="The waitlist">
          <p>
            Joining the waitlist means we&apos;ll email you when the app is
            ready and offer the founder cohort price. It does NOT commit you
            to anything. You can unsubscribe any time by replying to one of
            our emails or by emailing{" "}
            <a
              href="mailto:hello@leanscan.app"
              className="text-forest underline"
            >
              hello@leanscan.app
            </a>
            .
          </p>
        </Section>

        <Section title="Founder cohort pricing">
          <p>
            The first 500 paying users get $39/year locked in for life. This is
            a real commitment — we will honor it as long as the product exists.
            If we ever cease operating LeanScan, no further charges will be
            made.
          </p>
        </Section>

        <Section title="Beta nature & no warranties">
          <p>
            LeanScan is pre-launch. The app, when it ships, is provided
            &quot;as is&quot; without warranty of any kind, express or implied,
            including merchantability or fitness for a particular purpose. We
            do our best, but you use the product at your own risk.
          </p>
        </Section>

        <Section title="Not medical advice">
          <p>
            LeanScan is a nutrition and fitness tracking tool. It is not a
            medical device and we do not provide medical, dietetic, or
            psychological advice. Consult a qualified professional for medical
            decisions.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Don&apos;t use this site or the future app to do anything illegal,
            spam our waitlist, abuse our infrastructure, or scrape the site
            for resale. We may suspend or terminate access for misuse.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            To the maximum extent permitted by law, LeanScan&apos;s total
            liability for any claim arising from these terms or your use of
            the service is limited to the amount you have paid us in the past
            12 months (or $0 if you haven&apos;t paid us).
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are governed by the laws of India. Any disputes will
            be resolved in the courts of Karnataka, India.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms before launch. Material changes will be
            emailed to subscribers. The &quot;last updated&quot; date reflects
            the most recent revision.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions:{" "}
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
      <div className="text-charcoal leading-relaxed">{children}</div>
    </section>
  );
}
