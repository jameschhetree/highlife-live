import { ScrollReveal } from "@/components/ScrollReveal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | HighLife Live",
  description:
    "The terms governing your use of the HighLife Live website and booking services.",
};

export default function TermsPage() {
  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12">
              <span className="chip mb-5 inline-flex">Legal</span>
              <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
                Terms <span className="text-gradient-hero">of Use</span>
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
                  These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of the
                  HighLife Live website located at{" "}
                  <span className="text-foreground">highlifelive.com</span> (the
                  &ldquo;Site&rdquo;) and the services offered through it (the &ldquo;Services&rdquo;),
                  operated by HighLife Live (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By
                  accessing or using the Site, you agree to be bound by these Terms.
                  If you do not agree, do not use the Site.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By using the Site — including submitting a booking inquiry,
                  audition application, newsletter signup, or accessing a partner
                  portal — you acknowledge that you have read, understood, and agree
                  to be bound by these Terms and our{" "}
                  <Link
                    href="/privacy"
                    className="text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  , which is incorporated herein by reference.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  2. Eligibility
                </h2>
                <p>
                  The Site is intended for users who are at least 13 years of age.
                  By using the Site, you represent and warrant that you meet this
                  age requirement. If you are accessing the Site on behalf of a
                  business or organization, you represent that you have the authority
                  to bind that entity to these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  3. Description of Services
                </h2>
                <p>
                  HighLife Live is a talent booking platform that connects venues,
                  promoters, and talent buyers with a curated roster of artists in
                  the DMV (DC, Maryland, Virginia) area and beyond. Our Services
                  include:
                </p>
                <ul className="mt-4 space-y-2 list-none">
                  {[
                    "An inquiry-based booking system where venues and promoters can request artists for events.",
                    "An audition and artist submission portal for talent seeking representation.",
                    "A partner login portal for approved venues and promoters.",
                    "A newsletter through which subscribers receive updates on events and artist availability.",
                    "Public information about our artist roster, events, and entertainment services.",
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
                  4. No Guarantee of Bookings or Results
                </h2>
                <p>
                  Submitting a booking inquiry, audition application, or partner
                  request does not guarantee a booking, representation agreement, or
                  any particular outcome. HighLife Live reserves the right to
                  evaluate all submissions and decline any inquiry or application at
                  its sole discretion. We do not guarantee that any artist will be
                  available, that any event will take place, or that any submission
                  will result in a business relationship.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  5. Partner Accounts and Portals
                </h2>
                <p className="mb-4">
                  Venue and promoter partner accounts are approved at HighLife
                  Live&rsquo;s discretion. If you are granted a partner login, you agree
                  to:
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    "Keep your login credentials confidential and not share them with others.",
                    "Notify us immediately of any unauthorized access to your account.",
                    "Use the partner portal only for its intended purpose — managing and tracking booking inquiries.",
                    "Not attempt to access areas of the Site or data you are not authorized to access.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-pink-400 mt-1 shrink-0">&#8212;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  We reserve the right to suspend or terminate any partner account
                  at any time for any reason.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  6. Booking and Inquiry Process
                </h2>
                <p>
                  All booking inquiries submitted through the Site are reviewed by
                  our team. Submission of a booking form does not create a binding
                  contract. A booking is only confirmed when HighLife Live and the
                  relevant parties execute a written booking agreement. Any proposed
                  fees, offers, or terms communicated through the Site or by email
                  are preliminary and subject to change until a final agreement is
                  signed.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  7. User Content and Submissions
                </h2>
                <p>
                  By submitting content through the Site — including booking
                  inquiries, audition materials, bios, photos, or links — you grant
                  HighLife Live a non-exclusive, royalty-free, worldwide license to
                  use, store, display, and share that content as reasonably necessary
                  to provide the Services, evaluate your submission, and coordinate
                  with artists, agents, and venues. You represent that you own or
                  have the rights to any content you submit and that it does not
                  violate the rights of any third party.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  8. Prohibited Conduct
                </h2>
                <p className="mb-4">You agree not to:</p>
                <ul className="space-y-2 list-none">
                  {[
                    "Use the Site for any unlawful purpose or in violation of any applicable law.",
                    "Submit false, misleading, or fraudulent information.",
                    "Interfere with or disrupt the operation of the Site or its servers.",
                    "Attempt to gain unauthorized access to any part of the Site, partner portal, or data.",
                    "Use automated tools to scrape, crawl, or collect data from the Site without our written permission.",
                    "Impersonate any person or entity or misrepresent your affiliation with any organization.",
                    "Harass, threaten, or harm any HighLife Live artists, agents, staff, or users.",
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
                  9. Intellectual Property
                </h2>
                <p>
                  The Site and its content — including text, graphics, logos, images,
                  artist profiles, and software — are the property of HighLife Live
                  or its licensors and are protected by copyright, trademark, and
                  other intellectual property laws. You may not reproduce, modify,
                  distribute, or create derivative works from any content on the Site
                  without our prior written permission.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  10. Third-Party Links
                </h2>
                <p>
                  The Site may contain links to third-party websites, including
                  social media profiles, ticketing platforms, and partner sites. We
                  do not control and are not responsible for the content, privacy
                  practices, or terms of those sites. Links are provided for
                  convenience only and do not constitute an endorsement.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  11. Disclaimers
                </h2>
                <p>
                  THE SITE AND SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
                  WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                  INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
                  FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT
                  THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF
                  VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  12. Limitation of Liability
                </h2>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, HIGHLIFE LIVE AND ITS
                  OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR
                  ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                  DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SITE OR
                  SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH
                  DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM
                  THESE TERMS OR YOUR USE OF THE SITE SHALL NOT EXCEED ONE HUNDRED
                  DOLLARS ($100).
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  13. Indemnification
                </h2>
                <p>
                  You agree to indemnify, defend, and hold harmless HighLife Live
                  and its officers, directors, employees, and agents from and against
                  any claims, liabilities, damages, losses, and expenses (including
                  reasonable legal fees) arising out of or relating to your use of
                  the Site, your violation of these Terms, or your violation of any
                  rights of a third party.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  14. Termination
                </h2>
                <p>
                  We reserve the right to suspend or terminate your access to the
                  Site, including any partner account, at any time and for any
                  reason, without notice or liability. Upon termination, these Terms
                  will remain in effect with respect to any prior use of the Site.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  15. Governing Law
                </h2>
                <p>
                  These Terms are governed by and construed in accordance with the
                  laws of the District of Columbia, without regard to its conflict of
                  law principles. Any legal action or proceeding arising from these
                  Terms shall be brought exclusively in the courts located in the
                  District of Columbia.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  16. Dispute Resolution
                </h2>
                <p>
                  Before initiating any formal legal proceeding, you agree to
                  contact us at{" "}
                  <span className="text-foreground select-all">
                    info@highlifelive.com
                  </span>{" "}
                  and attempt to resolve any dispute informally. We will attempt in
                  good faith to resolve any complaint or dispute within 30 days of
                  receiving notice.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  17. Changes to These Terms
                </h2>
                <p>
                  We may update these Terms at any time. When we do, we will update
                  the effective date at the top of this page. Your continued use of
                  the Site after any changes constitutes your acceptance of the
                  revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  18. Contact
                </h2>
                <p>
                  For questions about these Terms, contact us at:
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
              <Link href="/privacy" className="hover:text-silver transition-colors">Privacy Policy</Link>
              <Link href="/cookies" className="hover:text-silver transition-colors">Cookie Policy</Link>
              <Link href="/accessibility" className="hover:text-silver transition-colors">Accessibility</Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
