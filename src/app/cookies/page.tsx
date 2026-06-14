import { ScrollReveal } from "@/components/ScrollReveal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | HighLife Live",
  description:
    "How HighLife Live uses cookies and how to control them in your browser.",
};

export default function CookiesPage() {
  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12">
              <span className="chip mb-5 inline-flex">Legal</span>
              <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
                Cookie <span className="text-gradient-hero">Policy</span>
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
                  This Cookie Policy explains how HighLife Live (&ldquo;we,&rdquo; &ldquo;our,&rdquo;
                  or &ldquo;us&rdquo;) uses cookies and similar technologies on our website at{" "}
                  <span className="text-foreground">highlifelive.com</span> (the
                  &ldquo;Site&rdquo;). It should be read alongside our{" "}
                  <Link
                    href="/privacy"
                    className="text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  1. What Are Cookies?
                </h2>
                <p>
                  Cookies are small text files placed on your device by a website
                  when you visit it. They allow the website to recognize your device,
                  remember information about your visit (such as your session state
                  or preferences), and operate core functionality like authentication.
                  Cookies are widely used to make websites work efficiently and to
                  provide information to site owners.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  2. Cookies We Use
                </h2>
                <p className="mb-6">
                  HighLife Live currently uses{" "}
                  <strong className="text-foreground">essential cookies only</strong>.
                  We do not use advertising cookies, tracking pixels, or third-party
                  analytics cookies.
                </p>
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <div>
                        <p className="text-foreground font-medium mb-1">Session Cookies</p>
                        <p className="text-sm">
                          Temporary cookies that are deleted when you close your
                          browser. These maintain your session state as you navigate
                          the Site.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <div>
                        <p className="text-foreground font-medium mb-1">Authentication Cookies</p>
                        <p className="text-sm">
                          Used to keep venue and promoter partners logged in to their
                          partner portal during an active session. These cookies are
                          necessary for the partner login feature to function.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  3. What We Do Not Use
                </h2>
                <p className="mb-4">
                  HighLife Live does not currently use:
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    "Advertising or retargeting cookies",
                    "Third-party analytics cookies (e.g., Google Analytics)",
                    "Social media tracking pixels",
                    "Behavioral profiling or fingerprinting tools",
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
                  4. Future Updates
                </h2>
                <p>
                  If we add marketing, analytics, or advertising cookies in the
                  future, we will update this policy and introduce an appropriate
                  consent mechanism before placing those cookies on your device. We
                  will notify users of material changes to our cookie practices by
                  updating the effective date of this policy.
                </p>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  5. Controlling Cookies in Your Browser
                </h2>
                <p className="mb-4">
                  You can control or disable cookies through your browser settings.
                  Note that disabling essential cookies may affect the functionality
                  of the Site, including the partner login portal. Here is how to
                  manage cookies in common browsers:
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    { name: "Chrome", url: "https://support.google.com/chrome/answer/95647" },
                    { name: "Firefox", url: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" },
                    { name: "Safari", url: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
                    { name: "Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                  ].map((browser) => (
                    <li key={browser.name} className="flex gap-3">
                      <span className="text-pink-400 mt-1 shrink-0">&#8212;</span>
                      <span>
                        <strong className="text-foreground">{browser.name}:</strong>{" "}
                        <a
                          href={browser.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors break-all"
                        >
                          {browser.url}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-4">
                  6. Contact Us
                </h2>
                <p>
                  If you have questions about our use of cookies, contact us at{" "}
                  <span className="text-foreground select-all">
                    info@highlifelive.com
                  </span>
                  .
                </p>
              </section>

            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-muted">
              <Link href="/privacy" className="hover:text-silver transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-silver transition-colors">Terms of Use</Link>
              <Link href="/accessibility" className="hover:text-silver transition-colors">Accessibility</Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
