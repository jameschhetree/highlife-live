"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Anchor,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Compass,
  Link as LinkIcon,
  Play,
  Sparkles,
} from "lucide-react";
import { gsap } from "gsap";
import type { GeneratedEpkPageProps } from "../types";
import "./epk.css";

type RuntimeAsset = {
  id?: string;
  src?: string;
  url?: string;
  alt?: string;
  mimeType?: string;
};

const GENRES = [
  { name: "Indie", note: "the compass point" },
  { name: "Grunge", note: "the weather front" },
  { name: "Alternative", note: "the open water" },
  { name: "Pop Hiphop", note: "the forward motion" },
  { name: "Country", note: "the backroad turn" },
];

function isRuntimeAsset(value: unknown): value is RuntimeAsset {
  return typeof value === "object" && value !== null;
}

function resolveAsset(assets: unknown, id: string): RuntimeAsset | undefined {
  if (Array.isArray(assets)) {
    return assets.find(
      (asset): asset is RuntimeAsset =>
        isRuntimeAsset(asset) && asset.id === id,
    );
  }

  if (isRuntimeAsset(assets)) {
    const record = assets as Record<string, unknown>;
    const candidate = record[id];
    if (typeof candidate === "string") {
      return { id, url: candidate };
    }
    return isRuntimeAsset(candidate) ? candidate : undefined;
  }

  return undefined;
}

function assetSource(asset: RuntimeAsset | undefined) {
  return asset?.src ?? asset?.url;
}

function VideoVoyage({
  title,
  eyebrow,
  asset,
  active,
  onPlay,
}: {
  title: string;
  eyebrow: string;
  asset: RuntimeAsset | undefined;
  active: boolean;
  onPlay: () => void;
}) {
  const src = assetSource(asset);

  return (
    <article className="kd-video-card" data-reveal>
      <div className="kd-video-frame">
        {active && src ? (
          <video controls autoPlay playsInline preload="metadata">
            <source src={src} type={asset?.mimeType ?? "video/mp4"} />
            Your browser does not support the video element.
          </video>
        ) : (
          <button
            className="kd-video-trigger"
            type="button"
            onClick={onPlay}
            disabled={!src}
            aria-label={src ? `Play ${title}` : `${title} is unavailable`}
          >
            <span className="kd-play-orbit" aria-hidden="true">
              <Play size={28} fill="currentColor" />
            </span>
            <span>{src ? "Click to play" : "Media unavailable"}</span>
          </button>
        )}
        <span className="kd-frame-corner kd-frame-corner--one" />
        <span className="kd-frame-corner kd-frame-corner--two" />
      </div>
      <p className="kd-kicker">{eyebrow}</p>
      <h3>{title}</h3>
    </article>
  );
}

export function EpkPage(props: GeneratedEpkPageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const assets = props.assets as unknown;
  const primarySocialLink =
    props.links.find((link) => /instagram/i.test(link.label)) ?? props.links[0];

  const betterWay = resolveAsset(assets, "cmqe4ozs4000704jvba9etra3");
  const garden = resolveAsset(assets, "cmqe4qzhi000904jvxfpyrras");
  const skullPhoto = resolveAsset(
    assets,
    "epk_asset_manual_1781463310108_kg4dld",
  );
  const animePhoto = resolveAsset(
    assets,
    "epk_asset_manual_1781463310488_d7f43t",
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    let observer: IntersectionObserver | undefined;
    const context = gsap.context(() => {
      gsap.from(".kd-hero-copy > *", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.11,
        ease: "power3.out",
      });
      gsap.from(".kd-hero-art", {
        x: 42,
        rotate: 2,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
      });
      gsap.to(".kd-moon", {
        y: 12,
        duration: 3.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.fromTo(
              entry.target,
              { y: 34, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.75, ease: "power2.out" },
            );
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.14 },
      );
      observer = revealObserver;

      root.querySelectorAll("[data-reveal]").forEach((node) => {
        revealObserver.observe(node);
      });

    }, root);

    return () => {
      observer?.disconnect();
      context.revert();
    };
  }, []);

  return (
    <main className="kd-epk" ref={rootRef}>
      <div className="kd-grain" aria-hidden="true" />
      <div className="kd-route" aria-hidden="true">
        <span />
        <Compass size={28} />
      </div>

      <header className="kd-topbar">
        <a className="kd-back" href={props.routes.roster}>
          <ArrowLeft size={17} />
          Back to Roster
        </a>
        <span className="kd-coordinate">NIGHT RUN / 01</span>
      </header>

      <section className="kd-hero" aria-labelledby="kindrew-title">
        <div className="kd-moon" aria-hidden="true" />
        <div className="kd-hero-copy">
          <p className="kd-kicker">
            Solo artist / genre drifter / live current
          </p>
          <h1 id="kindrew-title">
            KIN
            <span>DREW</span>
          </h1>
          <p className="kd-hero-pitch">
            A young indie artist moving freely through grunge, alternative,
            pop hiphop, and country with emotionally charged performances and
            upbeat momentum.
          </p>
          <div className="kd-actions">
            <a className="kd-button kd-button--primary" href={props.routes.booking}>
              <Anchor size={18} />
              Book KinDrew
            </a>
            {primarySocialLink && (
              <a
                className="kd-button kd-button--ghost"
                href={primarySocialLink.url}
                target="_blank"
                rel="noreferrer"
              >
                Follow the journey
                <ArrowUpRight size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="kd-hero-art" aria-label="Featured KinDrew photograph">
          <div className="kd-poster-mark" aria-hidden="true">
            自由
          </div>
          {assetSource(skullPhoto) ? (
            <img
              src={assetSource(skullPhoto)}
              alt="KinDrew and companions posed around a dirt bike with a skull prop"
              width={1280}
              height={1186}
              fetchPriority="high"
            />
          ) : (
            <div className="kd-asset-fallback">KIN DREW</div>
          )}
          <span className="kd-poster-label">FREE SPIRIT / DARK WATER</span>
        </div>
      </section>

      <section className="kd-manifesto" aria-labelledby="manifesto-title">
        <div className="kd-section-label">
          <span>01</span>
          Artist signal
        </div>
        <div className="kd-manifesto-copy" data-reveal>
          <p className="kd-kicker">No fixed lane</p>
          <h2 id="manifesto-title">
            Music that moves from backroads to open water.
          </h2>
          <p>
            KinDrew dabbles wherever the song leads. Country warmth can turn
            into hiphop energy, indie atmosphere, or a grunge edge. Across the
            shifts, the aim stays direct: paint a picture in the listener&apos;s
            head and bring the crowd through the full journey.
          </p>
        </div>
        <div className="kd-ink-slash" aria-hidden="true" />
      </section>

      <section className="kd-compass-section" aria-labelledby="sound-title">
        <div className="kd-section-heading" data-reveal>
          <div className="kd-section-label">
            <span>02</span>
            Sound map
          </div>
          <h2 id="sound-title">Five directions. One artist.</h2>
        </div>
        <div className="kd-genre-wheel">
          <div className="kd-compass-core" aria-hidden="true">
            <Compass size={56} strokeWidth={1} />
            <span>MOVE</span>
          </div>
          {GENRES.map((genre, index) => (
            <div
              className={`kd-genre kd-genre--${index + 1}`}
              key={genre.name}
              data-reveal
            >
              <span>0{index + 1}</span>
              <h3>{genre.name}</h3>
              <p>{genre.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="kd-visual-break" aria-label="KinDrew visual identity">
        <div className="kd-anime-art" data-reveal>
          {assetSource(animePhoto) ? (
            <img
              src={assetSource(animePhoto)}
              alt="Anime-styled KinDrew artwork with dark clothing and graphic symbols"
              width={1175}
              height={1280}
              loading="lazy"
            />
          ) : (
            <div className="kd-asset-fallback">ANIME NIGHT RUN</div>
          )}
        </div>
        <div className="kd-visual-copy" data-reveal>
          <Sparkles size={24} />
          <p className="kd-kicker">Samurai pirate / urban punk</p>
          <h2>Dark atmosphere. Upbeat adventure.</h2>
          <p>
            The look draws from emo-punk fashion, anime energy, and a
            free-spirited pirate character without losing the human center:
            music made to feel alive, outside, and in motion.
          </p>
        </div>
      </section>

      <section className="kd-media" aria-labelledby="media-title">
        <div className="kd-section-heading" data-reveal>
          <div className="kd-section-label">
            <span>03</span>
            Media cove
          </div>
          <h2 id="media-title">Press play when you&apos;re ready.</h2>
          <p>Two views of KinDrew&apos;s sound, presented in the requested order.</p>
        </div>
        <div className="kd-video-grid">
          <VideoVoyage
            title="Better Way"
            eyebrow="Official video / first watch"
            asset={betterWay}
            active={activeVideo === "better-way"}
            onPlay={() => setActiveVideo("better-way")}
          />
          <VideoVoyage
            title="The Garden"
            eyebrow="Live performance / presented by InaShell Ent."
            asset={garden}
            active={activeVideo === "the-garden"}
            onPlay={() => setActiveVideo("the-garden")}
          />
        </div>
      </section>

      <section className="kd-dock" aria-labelledby="dock-title">
        <div className="kd-dock-copy" data-reveal>
          <div className="kd-section-label">
            <span>04</span>
            Social dock
          </div>
          <h2 id="dock-title">Follow the signal.</h2>
          <p>
            Find KinDrew across social and streaming platforms, or bring the
            live journey to your next event.
          </p>
        </div>
        <nav className="kd-socials" aria-label="KinDrew public links">
          {props.links.map((link, index) => (
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              key={link.label}
              data-reveal
            >
              <span>0{index + 1}</span>
              <strong>{link.label}</strong>
              <ArrowUpRight size={20} />
            </a>
          ))}
        </nav>
      </section>

      <section className="kd-booking" aria-labelledby="booking-title">
        <div className="kd-booking-compass" aria-hidden="true">
          <Compass size={170} strokeWidth={0.6} />
        </div>
        <p className="kd-kicker">Next destination</p>
        <h2 id="booking-title">Bring KinDrew to the stage.</h2>
        <p>
          Genre-fluid energy, emotional performance, and a crowd-ready live
          journey.
        </p>
        <div className="kd-actions kd-actions--center">
          <a className="kd-button kd-button--primary" href={props.routes.booking}>
            <LinkIcon size={18} />
            Book This Artist
          </a>
          <a className="kd-button kd-button--ghost" href={props.routes.events}>
            <CalendarDays size={18} />
            Events &amp; Tickets
          </a>
        </div>
      </section>

      <footer className="kd-footer">
        <span>KINDREW / ELECTRONIC PRESS KIT</span>
        <span>Presented with HighLife Live</span>
      </footer>
    </main>
  );
}

export default EpkPage;
