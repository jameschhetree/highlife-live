import { ScrollReveal } from "@/components/ScrollReveal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility | HighLife Live",
  description:
    "HighLife Live's commitment to web accessibility and how to report issues.",
};

export default function AccessibilityPage() {
  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12">
              <span className="chip mb-5 inline-flex">Accessibility</span>
              <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
                Accessibility <span className="text-gradient-hero">Statement</span>
              </h1>
              <p className="text-silver leading-relaxed">
                Last updated: June 2026
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-10 text-[15px] leading-relaxed text-silver">

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  Our Commitment
                </h2>
                <p>
                  HighLife Live is committed to ensuring that our website is
                  accessible to all users, including people with disabilities. We
                  believe that everyone should be able to access information about
                  our artists, submit booking inquiries, and use our platform without
                  barriers.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  Target Standard
                </h2>
                <p>
                  We aim for our website to conform to the{" "}
                  <strong className="text-foreground">
                    Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
                  </strong>
                  . These guidelines explain how to make web content more accessible
                  to people with a wide range of disabilities, including visual,
                  auditory, physical, speech, cognitive, language, learning, and
                  neurological disabilities.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  Efforts Being Made
                </h2>
                <p className="mb-4">Our ongoing accessibility efforts include:</p>
                <ul className="space-y-2 list-none">
                  {[
                    "Providing descriptive alt text for images throughout the Site.",
                    "Using semantic HTML to structure content for screen readers.",
                    "Ensuring keyboard navigability across forms, navigation, and interactive elements.",
                    "Maintaining sufficient color contrast between text and background.",
                    "Adding ARIA labels and roles to complex interactive components.",
                    "Testing forms and user flows with keyboard-only navigation.",
                    "Using accessible focus indicators so keyboard users can see where they are on the page.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-pink-400 mt-1 shrink-0">&#8212;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  Known Limitations
                </h2>
                <p>
                  We are continuously working to improve the accessibility of our
                  Site. Some areas are still being improved, and we acknowledge that
                  our current implementation may not fully meet WCAG 2.1 AA in all
                  areas. We are committed to addressing identified gaps as part of
                  our ongoing development process.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  Report an Issue
                </h2>
                <p className="mb-4">
                  If you encounter an accessibility barrier on our Site or have
                  difficulty using any part of highlifelive.com, we want to know
                  about it. Please contact us at:
                </p>
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-foreground font-medium">HighLife Live — Accessibility</p>
                  <p className="text-silver mt-1 select-all">info@highlifelive.com</p>
                </div>
                <p className="mt-4">
                  Please describe the specific issue you encountered, the page where
                  it occurred, and your browser and assistive technology if known. We
                  aim to respond to accessibility feedback within 5 business days and
                  to resolve issues within a reasonable timeframe.
                </p>
              </section>

            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-muted">
              <Link href="/privacy" className="hover:text-silver transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-silver transition-colors">Terms of Use</Link>
              <Link href="/cookies" className="hover:text-silver transition-colors">Cookie Policy</Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
