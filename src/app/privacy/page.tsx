import { ScrollReveal } from "@/components/ScrollReveal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | HighLife Live",
  description:
    "Learn how HighLife Live collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12">
              <span className="chip mb-5 inline-flex">Legal</span>
              <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
                Privacy <span className="text-gradient-hero">Policy</span>
              </h1>
              <p className="text-silver leading-relaxed">
                Effective Date: June 2026
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-10 text-[15px] leading-relaxed text-silver">

              <section>
                <p>
                  HighLife Live (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting the privacy
                  of individuals who interact with our website at{" "}
                  <span className="text-foreground">highlifelive.com</span> (the
                  &ldquo;Site&rdquo;). This Privacy Policy explains what information we collect,
                  how we use it, and your rights regarding that information.
                </p>
                <p className="mt-4">
                  By using the Site, you agree to the practices described in this
                  Privacy Policy. If you do not agree, please do not use the Site.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  1. Information We Collect
                </h2>
                <p className="mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    "Contact information — name, email address, and phone number submitted through booking, audition, or contact forms.",
                    "Booking inquiries — venue name, event date, event description, and proposed offer amounts submitted through the booking form at /book.",
                    "Audition submissions — performance information, genre, social media links, and supporting materials submitted through the audition form at /findanagent.",
                    "Newsletter signups — email addresses submitted to receive updates about HighLife Live events and artist availability.",
                    "Partner login credentials — email address and account credentials for venue and promoter partner accounts.",
                    "Usage data — automatically collected information such as IP address, browser type, pages visited, and referring URLs, used to operate and improve the Site.",
                    "Cookies — small data files stored on your device. See Section 6 for details.",
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
                  2. How We Use Your Information
                </h2>
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="space-y-2 list-none">
                  {[
                    "Respond to booking inquiries and coordinate with relevant artists, agents, venues, and service providers.",
                    "Review audition submissions and follow up with applicants when appropriate.",
                    "Operate and maintain partner login accounts for venues and promoters.",
                    "Send newsletters and updates to subscribers who have opted in.",
                    "Communicate with you about your inquiries, submissions, or account.",
                    "Improve the Site and our booking services.",
                    "Comply with applicable legal obligations.",
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
                  3. How We Share Your Information
                </h2>
                <p className="mb-4">
                  <strong className="text-foreground">
                    HighLife Live does not currently sell or share your personal
                    information for targeted advertising.
                  </strong>
                </p>
                <p className="mb-4">
                  We may share information with the following categories of service
                  providers who assist us in operating the Site and our services:
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    "Vercel — website hosting and infrastructure.",
                    "Database provider — secure storage of booking, audition, and subscriber data.",
                    "Email service provider — delivery of confirmation emails and newsletters.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-pink-400 mt-1 shrink-0">&#8212;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  These providers access your data only to perform services on our
                  behalf and are contractually obligated to protect it. We may also
                  disclose information when required by law or to protect the rights
                  and safety of HighLife Live or others.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  4. Sharing With Artists, Agents, and Venues
                </h2>
                <p>
                  When you submit a booking inquiry, the information you provide
                  (including your contact details, event information, and proposed
                  offer) may be shared with the artist, their management, and any
                  relevant venue representatives involved in evaluating your request.
                  This sharing is necessary to operate our booking coordination
                  service.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  5. Cookies and Tracking
                </h2>
                <p className="mb-4">
                  We use essential cookies to operate the Site, including session
                  cookies required for partner login functionality and authentication.
                  We do not currently use advertising cookies, tracking pixels, or
                  third-party analytics tools that profile your behavior for
                  advertising purposes.
                </p>
                <p>
                  For full details, see our{" "}
                  <Link
                    href="/cookies"
                    className="text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  6. Your Rights
                </h2>
                <p className="mb-4">
                  Depending on your location, you may have the following rights
                  regarding your personal information:
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    "Access — request a copy of the personal information we hold about you.",
                    "Correction — request that we correct inaccurate or incomplete information.",
                    "Deletion — request that we delete your personal information, subject to certain legal exceptions.",
                    "Opt-out of marketing — unsubscribe from marketing emails at any time using the unsubscribe link in our emails or by visiting /unsubscribe.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-pink-400 mt-1 shrink-0">&#8212;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, contact us at{" "}
                  <span className="text-foreground select-all">
                    info@highlifelive.com
                  </span>
                  . We will respond within a reasonable timeframe.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  7. Data Retention
                </h2>
                <p>
                  We retain personal information for as long as necessary to fulfill
                  the purposes outlined in this Privacy Policy, including to provide
                  our services, comply with legal obligations, resolve disputes, and
                  enforce our agreements. Booking inquiry records and audition
                  submissions may be retained for the duration of our business
                  relationship with the relevant parties and for a reasonable period
                  thereafter. Newsletter subscriber records are retained until you
                  unsubscribe.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  8. Security
                </h2>
                <p>
                  We implement reasonable technical and organizational measures to
                  protect your personal information against unauthorized access,
                  disclosure, alteration, or destruction. Our Site is hosted on
                  Vercel and uses encrypted connections (HTTPS). However, no method
                  of transmission over the internet or method of electronic storage
                  is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  9. Children and Minors
                </h2>
                <p>
                  The Site is not directed at children under the age of 13. We do
                  not knowingly collect personal information from children under 13.
                  If you believe we have inadvertently collected such information,
                  please contact us at{" "}
                  <span className="text-foreground select-all">
                    info@highlifelive.com
                  </span>{" "}
                  and we will promptly delete it.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  10. Third-Party Links
                </h2>
                <p>
                  The Site may contain links to third-party websites, including
                  social media platforms, ticketing services, and partner sites. We
                  are not responsible for the privacy practices of those sites and
                  encourage you to review their privacy policies before providing any
                  personal information.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  11. Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. When we do,
                  we will update the effective date at the top of this page. Your
                  continued use of the Site after any changes constitutes your
                  acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  12. Contact Us
                </h2>
                <p>
                  If you have questions or concerns about this Privacy Policy or our
                  data practices, please contact us at:
                </p>
                <div className="mt-4 glass-card rounded-2xl p-5">
                  <p className="text-foreground font-medium">HighLife Live</p>
                  <p className="text-silver mt-1 select-all">info@highlifelive.com</p>
                </div>
              </section>

            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-muted">
              <Link href="/terms" className="hover:text-silver transition-colors">Terms of Use</Link>
              <Link href="/cookies" className="hover:text-silver transition-colors">Cookie Policy</Link>
              <Link href="/accessibility" className="hover:text-silver transition-colors">Accessibility</Link>
              <Link href="/unsubscribe" className="hover:text-silver transition-colors">Unsubscribe</Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
