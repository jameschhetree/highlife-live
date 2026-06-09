import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-radial-atmosphere flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          className="flex items-center gap-3 mb-10 justify-center"
        >
          <span className="relative w-12 h-12 inline-block">
            <Image src="/HighLifeLogo.png" alt="" fill sizes="48px" className="object-contain" />
          </span>
          <span className="font-display text-xl tracking-[0.2em] uppercase">
            HighLife Live
          </span>
        </Link>

        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 mb-3">
            404 · Not Found
          </p>
          <h1 className="font-display uppercase text-3xl sm:text-4xl tracking-tight leading-[0.95] mb-3">
            <span className="text-gradient-hero">Wrong room.</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            The page you tried isn&apos;t here. Most likely the URL changed or a
            link drifted — pick where you want to go and we&apos;ll get you there
            in one tap.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              Public Site
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/8 border border-white/15 hover:bg-white/12 hover:border-white/25 text-[10px] tracking-[0.18em] uppercase font-bold text-foreground transition-colors"
            >
              Admin Login
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] tracking-[0.18em] uppercase text-zinc-500">
            <Link href="/events" className="hover:text-zinc-300 transition-colors">Events</Link>
            <Link href="/roster" className="hover:text-zinc-300 transition-colors">Roster</Link>
            <Link href="/book" className="hover:text-zinc-300 transition-colors">Book</Link>
            <Link href="/findanagent" className="hover:text-zinc-300 transition-colors">Auditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
