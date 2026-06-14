"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Anchor,
  ArrowLeft,
  ArrowUpRight,
  Bone,
  CalendarDays,
  Compass,
  Link as LinkIcon,
  Play,
  Skull,
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

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        let coveObserver: IntersectionObserver | undefined;

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

        const nextRevealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              gsap.fromTo(
                entry.target,
                { y: 34, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.75, ease: "power2.out" },
              );
              nextRevealObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.14 },
        );
        root.querySelectorAll("[data-reveal]").forEach((node) => {
          nextRevealObserver.observe(node);
        });

        const cove = root.querySelector(".kd-media");
        if (cove) {
          gsap.set(".kd-palm--left", { xPercent: 34, rotate: 5 });
          gsap.set(".kd-palm--right", { xPercent: -34, rotate: -5 });
          gsap.set(".kd-media-content", { opacity: 0.3, scale: 0.985 });

          const nextCoveObserver = new IntersectionObserver(
            ([entry]) => {
              if (!entry?.isIntersecting) return;
              gsap
                .timeline({ defaults: { ease: "power3.inOut" } })
                .to(".kd-palm--left", {
                  xPercent: -92,
                  rotate: -8,
                  duration: 1.2,
                })
                .to(
                  ".kd-palm--right",
                  { xPercent: 92, rotate: 8, duration: 1.2 },
                  "<",
                )
                .to(
                  ".kd-media-content",
                  { opacity: 1, scale: 1, duration: 0.85 },
                  "<0.22",
                )
                .from(
                  ".kd-treasure-route span",
                  { scale: 0, stagger: 0.08, duration: 0.28 },
                  "<0.1",
                );
              nextCoveObserver.disconnect();
            },
            { threshold: 0.22 },
          );
          coveObserver = nextCoveObserver;
          nextCoveObserver.observe(cove);
        }

        return () => {
          nextRevealObserver.disconnect();
          coveObserver?.disconnect();
        };
      });
    }, root);

    return () => {
      media.revert();
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
            Seasoned indie artist moving freely through whatever genre he
            pleases, from hiphop to alternative rock, Kin Drew delivers
            emotionally charged performances and upbeat momentum. With a dream
            to sail the Seven Seas, Kin brings a contagious spirit to every
            show, forever showing love to his community of peace and freedom{" "}
            <em>nu3era</em>.
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
          <div className="kd-crossbones" aria-hidden="true">
            <Bone className="kd-bone kd-bone--one" />
            <Bone className="kd-bone kd-bone--two" />
            <Skull />
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

      <section className="kd-media" aria-labelledby="media-title">
        <div className="kd-palm-curtain" aria-hidden="true">
          <div className="kd-palm kd-palm--left">
            <span className="kd-palm-trunk" />
            <span className="kd-palm-frond kd-palm-frond--1" />
            <span className="kd-palm-frond kd-palm-frond--2" />
            <span className="kd-palm-frond kd-palm-frond--3" />
            <span className="kd-palm-frond kd-palm-frond--4" />
            <span className="kd-palm-frond kd-palm-frond--5" />
          </div>
          <div className="kd-palm kd-palm--right">
            <span className="kd-palm-trunk" />
            <span className="kd-palm-frond kd-palm-frond--1" />
            <span className="kd-palm-frond kd-palm-frond--2" />
            <span className="kd-palm-frond kd-palm-frond--3" />
            <span className="kd-palm-frond kd-palm-frond--4" />
            <span className="kd-palm-frond kd-palm-frond--5" />
          </div>
        </div>
        <div className="kd-media-content">
          <div className="kd-section-heading kd-media-heading" data-reveal>
            <div className="kd-section-label">
              <span>01</span>
              Media cove
            </div>
            <p className="kd-kicker">Wanted transmissions / found treasure</p>
            <h2 id="media-title">Recent visuals</h2>
            <p>
              The first place to see new releases; occasional treasure chest
              with sneak peaks.
            </p>
          </div>
          <div className="kd-treasure-map" aria-hidden="true">
            <div className="kd-island">
              <span className="kd-island-x">X</span>
              <Skull size={24} />
            </div>
            <div className="kd-treasure-route">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
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
          <Skull size={24} />
          <p className="kd-kicker">One soul / live free</p>
          <h2>The. Pirate. King.</h2>
          <p>
            Kin Drew&apos;s work highlights his stylistic themes and is a cult
            classic for his fans.
          </p>
        </div>
      </section>

      <section className="kd-manifesto" aria-labelledby="manifesto-title">
        <div className="kd-section-label">
          <span>02</span>
          Artist signal
        </div>
        <div className="kd-manifesto-copy" data-reveal>
          <p className="kd-kicker">Until there&apos;s no wind on the sails...</p>
          <h2 id="manifesto-title">The crew that rules the sea</h2>
          <p>
            Coming from the DMV region, Kin Drew has been on his musical journey
            since high school, consistently growing his fan base along with a
            community and message that is <em>nu3era</em>. With his ability to
            captivate any mind and gift dreams as large as his, Kin Drew has
            championed the idea of living free with <em>nu3era</em> and his
            music.
          </p>
        </div>
        <div className="kd-ink-slash" aria-hidden="true" />
      </section>

      <section className="kd-dock" aria-labelledby="dock-title">
        <div className="kd-dock-copy" data-reveal>
          <div className="kd-section-label">
            <span>03</span>
            Social dock
          </div>
          <h2 id="dock-title">Follow the ship.</h2>
          <p>Get your spot on the boat and put wind in the sails.</p>
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
        <div className="kd-booking-bones" aria-hidden="true">
          <Bone />
          <Skull />
          <Bone />
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
