import EmailForm from "./components/EmailForm";
import { siteConfig } from "@/lib/site";

const productLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "HealthApplication",
  operatingSystem: "iOS, Android",
  description: siteConfig.description,
  url: siteConfig.url,
  offers: {
    "@type": "Offer",
    price: "39",
    priceCurrency: "USD",
    description: "Founder cohort — $39/year locked in for life",
    availability: "https://schema.org/PreOrder",
  },
  publisher: { "@type": "Organization", name: siteConfig.name },
};

export default function Home() {
  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-line backdrop-blur-md bg-cream/90">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="serif text-xl font-semibold text-forest tracking-tight">
            <span className="inline-block w-2 h-2 bg-amber rounded-full mr-2 align-middle" />
            LeanScan
          </div>
          <a
            href="#waitlist"
            className="bg-forest text-cream px-5 py-2.5 rounded-full text-sm font-medium hover:bg-forest-deep transition-colors"
          >
            Get early access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.2fr_1fr] gap-12 md:gap-20 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-line rounded-full text-xs uppercase tracking-widest text-forest bg-paper mb-6">
              <span className="w-1.5 h-1.5 bg-amber rounded-full" />
              Early access
            </span>
            <h1 className="serif text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.02] tracking-tight text-forest mb-6">
              Snap your meal.{" "}
              <em className="text-amber font-normal italic">
                Track your day.
              </em>
            </h1>
            <p className="text-lg text-charcoal mb-8 max-w-lg leading-relaxed">
              An AI-powered, protein-first health tracker. Meals, weight,
              training, and how you feel — in one tap. For the people tired of
              stacking five separate apps.
            </p>
            <div id="waitlist">
              <EmailForm />
            </div>
            <p className="text-sm text-muted mt-4">
              <strong className="text-forest font-semibold">7-day free trial</strong>
              {" "}· No credit card · Launching soon
            </p>
          </div>

          {/* Phone mock */}
          <div className="flex justify-center md:justify-end">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <h2 className="serif text-3xl md:text-5xl font-medium text-forest tracking-tight mb-4 max-w-2xl">
            The tracker MyFitnessPal users wish existed.
          </h2>
          <p className="text-lg text-muted mb-14 max-w-xl">
            Three deliberate choices that make every other tracker feel bloated.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              eyebrow="01"
              title="Protein-first, by default"
              body="Your home screen leads with the macro that actually matters. Calories are secondary. Switchable, but the default tells you everything."
            />
            <FeatureCard
              eyebrow="02"
              title="AI photo logging"
              body="Snap your plate. We parse the protein, macros, and calories in seconds. No scrolling food databases, no '47 baby carrots' guesses."
            />
            <FeatureCard
              eyebrow="03"
              title="One app for everything"
              body="Meals, weight, training, how you feel. One dashboard, one decision. Delete the other four apps on your phone."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-paper border-t border-line">
        <div className="max-w-4xl mx-auto">
          <h2 className="serif text-3xl md:text-5xl font-medium text-forest tracking-tight mb-14">
            How it works
          </h2>
          <div className="space-y-10">
            <Step
              n="1"
              title="Snap your meal"
              body="Take a photo. Our AI estimates protein, calories, and macros in under three seconds. Edit anything, log it."
            />
            <Step
              n="2"
              title="Hit your protein target"
              body="A daily target calculated from your weight, goal, and activity. The ring fills up — no shame if you miss, no guilt if you go over."
            />
            <Step
              n="3"
              title="See real progress"
              body="A weekly summary delivered by email. Weight trend, protein consistency, training volume, mood. No diet culture, just signal."
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-6 py-20 border-t border-line">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="serif text-3xl md:text-4xl font-medium text-forest tracking-tight mb-6">
            Built by an indie dev.{" "}
            <em className="text-amber font-normal italic">
              Not a diet company.
            </em>
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            No medical claims. No shame-based UX. No &ldquo;did you really eat
            that?&rdquo; modals. Just an honest tool for people who already care
            about their health and want to spend less time logging it.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-forest text-cream">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="serif text-3xl md:text-5xl font-medium tracking-tight mb-6">
            Be one of the first 500.
          </h2>
          <p className="text-lg text-cream/85 mb-8 max-w-xl mx-auto">
            Founder cohort gets $39/year locked in for life — about half off the
            public launch price. Drop your email below.
          </p>
          <div className="max-w-md mx-auto">
            <EmailForm variant="dark" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-line">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="serif font-semibold text-forest">
            <span className="inline-block w-1.5 h-1.5 bg-amber rounded-full mr-2 align-middle" />
            LeanScan
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-forest transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-forest transition-colors">
              Terms
            </a>
            <a
              href="mailto:hello@leanscan.app"
              className="hover:text-forest transition-colors"
            >
              Contact
            </a>
          </div>
          <div>© 2026 LeanScan</div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-line rounded-2xl p-7 bg-paper">
      <div className="serif text-amber text-sm mb-3 font-medium tracking-wider">
        {eyebrow}
      </div>
      <h3 className="serif text-2xl font-medium text-forest mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-6 md:gap-8 items-start">
      <div className="serif text-3xl text-amber font-medium shrink-0 w-10">
        {n}
      </div>
      <div>
        <h3 className="serif text-2xl font-medium text-forest mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative w-[280px] h-[580px] bg-forest-deep rounded-[40px] p-3 shadow-2xl">
      <div className="w-full h-full bg-paper rounded-[30px] overflow-hidden flex flex-col p-6">
        <div className="text-xs uppercase tracking-widest text-muted mb-1">
          Today
        </div>
        <div className="serif text-3xl text-forest font-medium mb-6">
          Protein
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="serif text-6xl text-forest font-medium">142</span>
          <span className="text-muted text-lg">/ 160g</span>
        </div>
        <div className="text-sm text-sage mb-6 font-medium">
          On track · 18g to goal
        </div>

        <div className="h-2 bg-cream-dark rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-amber rounded-full"
            style={{ width: "88%" }}
          />
        </div>

        <div className="space-y-3 flex-1">
          <MealRow time="8:14a" name="Greek yogurt, berries" g="28g" />
          <MealRow time="12:40p" name="Chicken bowl, rice" g="54g" />
          <MealRow time="3:20p" name="Cottage cheese" g="22g" />
          <MealRow time="7:05p" name="Salmon, broccoli" g="38g" />
        </div>

        <div className="mt-4 -mx-6 -mb-6 px-6 py-4 bg-forest flex items-center justify-center">
          <div className="text-cream text-sm font-medium">
            + Snap your next meal
          </div>
        </div>
      </div>
    </div>
  );
}

function MealRow({ time, name, g }: { time: string; name: string; g: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex gap-3">
        <span className="text-muted w-12">{time}</span>
        <span className="text-charcoal">{name}</span>
      </div>
      <span className="text-forest font-medium">{g}</span>
    </div>
  );
}
