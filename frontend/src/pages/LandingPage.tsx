import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

/* ─── SVG Icons ────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="15" y2="16" />
  </svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─── Styles ────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

    :root {
      --cream:  #fdf8f3;
      --warm:   #f5ede0;
      --amber:  #d97706;
      --amb-d:  #92400e;
      --amb-l:  #fbbf24;
      --ink:    #1c1209;
      --muted:  #6b5b45;
      --border: #e8d9c5;
    }

    body { background: var(--cream); color: var(--ink); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
    a    { color: inherit; }

    /* ══ NAV ══════════════════════════════════════════════ */
    .nav {
      position: fixed; inset: 0 0 auto 0; z-index: 200;
      transition: background .3s, box-shadow .3s;
    }
    .nav.scrolled {
      background: rgba(253,248,243,.96);
      backdrop-filter: blur(14px);
      box-shadow: 0 1px 0 var(--border);
    }
    .nav-bar {
      max-width: 1160px; margin: 0 auto;
      padding: 0 20px; height: 64px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .logo       { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-mark  { width: 36px; height: 36px; border-radius: 9px; background: var(--amber); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces',serif; font-weight: 900; color: #fff; font-size: 17px; flex-shrink: 0; }
    .logo-name  { font-family: 'Fraunces',serif; font-weight: 700; font-size: 19px; color: var(--ink); }
    .nav-links  { display: flex; align-items: center; gap: 32px; }
    .nav-links a { font-size: 14px; font-weight: 500; color: var(--muted); text-decoration: none; transition: color .2s; }
    .nav-links a:hover { color: var(--amber); }
    .nav-cta    { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 8px; background: var(--amber); color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; transition: background .2s, transform .2s; }
    .nav-cta:hover { background: var(--amb-d); transform: translateY(-1px); }
    .nav-ham    { display: none; background: none; border: none; cursor: pointer; color: var(--ink); padding: 4px; line-height: 0; }

    .nav-drawer { display: none; flex-direction: column; background: var(--cream); border-top: 1px solid var(--border); padding: 16px 20px 24px; gap: 0; }
    .nav-drawer.open { display: flex; }
    .nav-drawer a { display: block; padding: 13px 0; font-size: 15px; font-weight: 500; color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--border); transition: color .2s; }
    .nav-drawer a:hover { color: var(--amber); }
    .nav-drawer a:last-of-type { border-bottom: none; }
    .drawer-cta { margin-top: 16px; display: block; text-align: center; padding: 13px; border-radius: 9px; background: var(--amber); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; }

    @media (max-width: 720px) { .nav-links { display: none; } .nav-ham { display: block; } }

    /* ══ BUTTONS ══════════════════════════════════════════ */
    .btn-amber { display: inline-flex; align-items: center; gap: 8px; padding: 13px 26px; border-radius: 9px; background: var(--amber); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; transition: background .2s, transform .2s; border: none; cursor: pointer; }
    .btn-amber:hover { background: var(--amb-d); transform: translateY(-1px); }
    .btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; border-radius: 9px; border: 1.5px solid var(--border); background: transparent; color: var(--muted); font-size: 15px; font-weight: 500; text-decoration: none; transition: all .2s; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--amber); color: var(--amber); }
    .btn-white { display: inline-flex; align-items: center; gap: 8px; padding: 14px 30px; border-radius: 9px; background: #fff; color: var(--ink); font-size: 15px; font-weight: 600; text-decoration: none; transition: background .2s, transform .2s; }
    .btn-white:hover { background: var(--warm); transform: translateY(-1px); }

    /* ══ HERO ═════════════════════════════════════════════ */
    .hero {
      padding: 112px 20px 72px;
      background:
        radial-gradient(ellipse 70% 55% at 85% 25%, #fde68a40 0%, transparent 65%),
        radial-gradient(ellipse 55% 65% at 5%  85%, #fed7aa30 0%, transparent 60%),
        var(--cream);
      position: relative; overflow: hidden;
    }
    .hero::after {
      content: ''; position: absolute; top: -80px; right: -100px;
      width: 480px; height: 480px; border-radius: 50%;
      background: conic-gradient(from 180deg, #fbbf2420, #fb923c20, #fbbf2400);
      animation: slowspin 24s linear infinite; pointer-events: none;
    }
    @keyframes slowspin { to { transform: rotate(360deg); } }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:.35} }

    .hero-wrap { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 400px; gap: 72px; align-items: center; position: relative; z-index: 2; }

    .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; color: var(--amber); margin-bottom: 22px; }
    .blink-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amb-l); animation: blink 2.2s ease-in-out infinite; }

    .hero h1 { font-family: 'Fraunces',serif; font-size: clamp(40px,5.5vw,72px); font-weight: 900; line-height: 1.06; color: var(--ink); margin-bottom: 24px; }
    .hero h1 em { font-style: italic; background: linear-gradient(135deg,var(--amber),#ea580c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

    .hero-sub { font-size: 16px; line-height: 1.8; color: var(--muted); font-weight: 300; max-width: 480px; margin-bottom: 36px; }
    .hero-btns { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .hero-trust { margin-top: 40px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .trust-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
    .ck { color: var(--amber); display: flex; }

    /* hero panel */
    .hero-panel { background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 28px; box-shadow: 0 20px 55px -10px rgba(180,120,30,.16); }
    .panel-tag  { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--amber); background: #fef3c7; padding: 4px 10px; border-radius: 4px; margin-bottom: 18px; }
    .p-big  { font-family: 'Fraunces',serif; font-size: 46px; font-weight: 900; line-height: 1; color: var(--ink); }
    .p-unit { font-size: 13px; color: var(--muted); margin-top: 4px; margin-bottom: 4px; }
    .p-hr   { height: 1px; background: var(--border); margin: 18px 0; }
    .p-row  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .p-row:last-of-type { margin-bottom: 0; }
    .p-lbl  { font-size: 13px; color: var(--muted); }
    .p-val  { font-size: 13px; font-weight: 600; color: var(--ink); }
    .badge  { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
    .bg-g   { background: #d1fae5; color: #065f46; }
    .bg-a   { background: #fef3c7; color: #92400e; }
    .p-bar  { height: 5px; background: var(--warm); border-radius: 3px; overflow: hidden; margin-top: 6px; }
    .p-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg,var(--amb-l),var(--amber)); }
    .p-cta  { margin-top: 20px; display: block; width: 100%; text-align: center; padding: 13px; border-radius: 9px; background: var(--ink); color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; transition: background .2s; }
    .p-cta:hover { background: #2d1a08; }

    @media (max-width: 960px) {
      .hero-wrap  { grid-template-columns: 1fr; gap: 44px; }
      .hero h1    { font-size: clamp(36px,7.5vw,54px); }
      .hero-panel { max-width: 420px; }
    }
    @media (max-width: 600px) {
      .hero       { padding: 88px 18px 52px; }
      .hero h1    { font-size: clamp(30px,9vw,42px); }
      .hero-sub   { font-size: 15px; }
      .hero-panel { display: none; }
      .hero-btns  { flex-direction: column; }
      .hero-btns a, .hero-btns button { width: 100%; justify-content: center; text-align: center; }
      .hero-trust { gap: 10px; margin-top: 28px; }
    }

    /* ══ MARQUEE ══════════════════════════════════════════ */
    .marquee     { background: var(--ink); padding: 13px 0; overflow: hidden; }
    .marquee-row { display: flex; white-space: nowrap; animation: ticker 30s linear infinite; }
    .marquee-row:hover { animation-play-state: paused; }
    .m-item      { display: inline-flex; align-items: center; gap: 22px; padding: 0 36px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--amber); }
    .m-dot       { color: #3d2a0f; font-size: 16px; }
    @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    /* ══ SECTIONS (shared) ════════════════════════════════ */
    .sec    { padding: 88px 20px; }
    .sec-in { max-width: 1100px; margin: 0 auto; }
    .lbl    { display: block; font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--amber); margin-bottom: 10px; }
    .ttl    { font-family: 'Fraunces',serif; font-size: clamp(28px,3.8vw,46px); font-weight: 900; line-height: 1.1; color: var(--ink); margin-bottom: 18px; }
    .ttl em { font-style: italic; color: var(--amber); }
    .body   { font-size: 15px; line-height: 1.8; color: var(--muted); font-weight: 300; max-width: 520px; }

    @media (max-width: 600px) { .sec { padding: 60px 18px; } }

    /* ══ FEATURES ═════════════════════════════════════════ */
    .bg-white { background: #fff; }
    .feat-layout { display: grid; grid-template-columns: 300px 1fr; gap: 72px; align-items: start; }
    .feat-head   { position: sticky; top: 88px; }
    .feat-item   { display: flex; align-items: flex-start; gap: 16px; padding: 22px 0; border-bottom: 1px solid var(--border); }
    .feat-item:first-child { border-top: 1px solid var(--border); }
    .feat-n      { font-family: 'Fraunces',serif; font-size: 12px; font-weight: 400; color: var(--amber); min-width: 22px; margin-top: 3px; flex-shrink: 0; }
    .feat-item h3 { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 5px; }
    .feat-item p  { font-size: 13px; line-height: 1.75; color: var(--muted); font-weight: 300; }
    @media (max-width: 760px) { .feat-layout { grid-template-columns: 1fr; gap: 36px; } .feat-head { position: static; } }

    /* ══ STEPS ════════════════════════════════════════════ */
    .bg-warm   { background: var(--warm); }
    .steps-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-top: 52px; }
    .step-card { background: #fff; border-radius: 14px; padding: 28px 24px; border: 1px solid var(--border); position: relative; overflow: hidden; transition: box-shadow .3s, transform .3s; }
    .step-card:hover { box-shadow: 0 14px 36px -8px rgba(180,100,20,.15); transform: translateY(-4px); }
    .step-card::before { content: attr(data-n); position: absolute; top: -14px; right: 12px; font-family: 'Fraunces',serif; font-size: 80px; font-weight: 900; color: #fde68a; line-height: 1; pointer-events: none; transition: color .3s; }
    .step-card:hover::before { color: #fbbf24; }
    .step-lbl  { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--amber); margin-bottom: 10px; display: block; }
    .step-card h3 { font-family: 'Fraunces',serif; font-size: 20px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
    .step-card p  { font-size: 13px; line-height: 1.75; color: var(--muted); font-weight: 300; }
    @media (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 500px) { .steps-grid { grid-template-columns: 1fr; gap: 14px; } }

    /* ══ ACTIVATION ═══════════════════════════════════════ */
    .bg-ink { background: var(--ink); position: relative; overflow: hidden; }
    .bg-ink::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 65% 80% at 8% 55%, #d9770620 0%, transparent 60%), radial-gradient(ellipse 55% 60% at 92% 20%, #ea580c18 0%, transparent 55%); pointer-events: none; }
    .act-in { max-width: 720px; margin: 0 auto; text-align: center; position: relative; z-index: 2; }
    .act-in .lbl { color: var(--amb-l); }
    .act-in .ttl { color: #fff; }
    .act-body { font-size: 15px; line-height: 1.85; color: #a78a6a; font-weight: 300; margin-bottom: 32px; }
    .pills    { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; margin-bottom: 36px; }
    .pill     { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 50px; border: 1px solid #3d2a0f; font-size: 12px; font-weight: 500; color: #c9a96e; }
    .pill .ck { color: var(--amber); }

    /* ══ TESTIMONIALS ═════════════════════════════════════ */
    .bg-cream  { background: var(--cream); }
    .testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 52px; }
    .testi-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 28px 24px; transition: box-shadow .3s; }
    .testi-card:hover { box-shadow: 0 10px 28px -6px rgba(180,100,20,.1); }
    .stars    { display: flex; gap: 3px; margin-bottom: 16px; }
    .star-chr { color: var(--amb-l); font-size: 15px; }
    .testi-q  { font-family: 'Fraunces',serif; font-style: italic; font-size: 14px; line-height: 1.85; color: var(--ink); margin-bottom: 20px; }
    .t-author { display: flex; align-items: center; gap: 11px; }
    .avatar   { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg,var(--amb-l),var(--amber)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .t-name   { font-size: 13px; font-weight: 600; color: var(--ink); }
    .t-loc    { font-size: 11px; color: var(--muted); margin-top: 1px; }
    @media (max-width: 760px) { .testi-grid { grid-template-columns: 1fr; } }

    /* ══ REFERRAL ═════════════════════════════════════════ */
    .ref-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
    .chk-list   { list-style: none; margin: 24px 0 32px; display: flex; flex-direction: column; gap: 13px; }
    .chk-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 14px; color: var(--muted); font-weight: 300; line-height: 1.6; }
    .chk-icon   { width: 20px; height: 20px; border-radius: 50%; background: var(--amber); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
    .ref-card   { background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 32px; box-shadow: 0 18px 44px -10px rgba(180,100,20,.12); }
    .r-lbl      { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .r-big      { font-family: 'Fraunces',serif; font-size: 44px; font-weight: 900; line-height: 1; color: var(--ink); }
    .r-sub      { font-size: 12px; color: var(--muted); margin-top: 4px; margin-bottom: 24px; }
    .r-hr       { height: 1px; background: var(--border); margin-bottom: 20px; }
    .code-box   { background: var(--warm); border: 1px dashed var(--border); border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .code-lbl   { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
    .code-val   { font-family: 'Fraunces',serif; font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: .08em; margin-top: 3px; }
    .copy-btn   { flex-shrink: 0; font-size: 11px; font-weight: 600; color: var(--amber); background: none; border: 1px solid var(--amber); padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all .2s; white-space: nowrap; }
    .copy-btn:hover { background: var(--amber); color: #fff; }
    @media (max-width: 760px) { .ref-layout { grid-template-columns: 1fr; gap: 36px; } }

    /* ══ FAQ ══════════════════════════════════════════════ */
    .faq-layout { display: grid; grid-template-columns: 260px 1fr; gap: 72px; align-items: start; }
    .faq-head   { position: sticky; top: 88px; }
    .faq-item   { border-bottom: 1px solid var(--border); }
    .faq-item:first-child { border-top: 1px solid var(--border); }
    .faq-btn    { width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 20px 0; display: flex; justify-content: space-between; align-items: center; gap: 14px; font-size: 14px; font-weight: 600; color: var(--ink); font-family: 'DM Sans',sans-serif; transition: color .2s; }
    .faq-btn:hover { color: var(--amber); }
    .faq-arr    { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .3s; color: var(--muted); }
    .faq-item.open .faq-arr { background: var(--amber); border-color: var(--amber); color: #fff; transform: rotate(90deg); }
    .faq-body   { font-size: 13px; line-height: 1.85; color: var(--muted); font-weight: 300; max-height: 0; overflow: hidden; transition: max-height .4s ease, padding-bottom .3s ease; }
    .faq-item.open .faq-body { max-height: 220px; padding-bottom: 18px; }
    @media (max-width: 760px) { .faq-layout { grid-template-columns: 1fr; gap: 32px; } .faq-head { position: static; } }

    /* ══ FINAL CTA ════════════════════════════════════════ */
    .bg-deep { background: linear-gradient(135deg,#1c1209 0%,#2c1808 55%,#1c1209 100%); position: relative; overflow: hidden; }
    .bg-deep::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 110%, #d9770612 0%, transparent 60%); pointer-events: none; }
    .cta-in      { max-width: 660px; margin: 0 auto; text-align: center; position: relative; z-index: 2; }
    .cta-in .lbl { color: var(--amb-l); }
    .cta-in .ttl { color: #fff; }
    .cta-sub     { font-size: 15px; line-height: 1.85; color: #a78a6a; font-weight: 300; margin-bottom: 32px; }
    .cta-note    { font-size: 11px; color: #5b4020; margin-top: 16px; }
    .cta-note span { color: #7a5c3a; }

    /* ══ FOOTER ═══════════════════════════════════════════ */
    footer      { background: var(--ink); padding: 56px 20px 32px; }
    .foot-grid  { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 44px; padding-bottom: 44px; border-bottom: 1px solid #2d1f0a; }
    .foot-brand p { font-size: 13px; line-height: 1.8; color: #7a5c3a; font-weight: 300; margin-top: 13px; }
    footer h5   { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #6b4f30; margin-bottom: 14px; }
    footer ul   { list-style: none; display: flex; flex-direction: column; gap: 9px; }
    footer ul li a, footer ul li span { font-size: 13px; color: #7a5c3a; text-decoration: none; transition: color .2s; }
    footer ul li a:hover { color: var(--amb-l); }
    .foot-btm   { max-width: 1100px; margin: 24px auto 0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #4b3515; flex-wrap: wrap; gap: 6px; }
    .foot-btm a { color: #7a5c3a; text-decoration: none; }
    .foot-btm a:hover { color: var(--amb-l); }
    @media (max-width: 760px) { .foot-grid { grid-template-columns: 1fr 1fr; gap: 28px; } }
    @media (max-width: 480px) { .foot-grid { grid-template-columns: 1fr; } .foot-btm { flex-direction: column; text-align: center; } }
  `}</style>
);

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq,  setOpenFaq]  = useState<number | null>(null);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 36);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const copyCode = () => {
    navigator.clipboard?.writeText('QEZZY2024');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const toggleFaq = (i: number) => setOpenFaq(prev => (prev === i ? null : i));

  /* data */
  const features = [
    { title: 'Complete Tasks',         desc: 'A growing library of tasks built for the Kenyan market — flexible, straightforward, and rewarding on your schedule.' },
    { title: 'Dual Wallet System',     desc: 'Task income and referral bonuses sit in separate wallets so you always know exactly where every shilling comes from.' },
    { title: 'M-Pesa Withdrawals',     desc: 'Your money reaches you fast. Withdrawals go straight to M-Pesa or your bank with no extra steps.' },
    { title: 'Referral Bonuses',       desc: 'Share your code. When a friend activates, a bonus drops into your referral wallet immediately — no cap, no fine print.' },
    { title: 'Secure Authentication',  desc: 'Enterprise-grade Firebase security keeps your account and earnings protected around the clock.' },
    { title: 'Automatic Processing',   desc: 'Mobile money withdrawals are handled automatically — no waiting for manual approvals, no guesswork.' },
  ];

  const steps = [
    { n: '01', title: 'Create an Account',    desc: 'Sign up with your email or phone. It takes under two minutes and costs nothing.' },
    { n: '02', title: 'Set Up Your Profile',  desc: 'Add your details and link your payment method so withdrawals are always ready.' },
    { n: '03', title: 'Activate Your Access', desc: 'A small one-time fee unlocks all features. That exact amount is credited to your wallet.' },
    { n: '04', title: 'Earn & Withdraw',      desc: 'Browse tasks, complete them at your pace, and withdraw whenever you like.' },
  ];

  const testimonials = [
    { init: 'SN', name: 'Sarah Njeri',     loc: 'Nairobi',  q: 'I earn real money from home while caring for my kids. The M-Pesa withdrawals are so seamless — I was genuinely surprised by how smooth everything is.' },
    { init: 'RK', name: 'Richard Kenagwa', loc: 'Kisii',    q: 'I was skeptical at first. Then my first withdrawal went through and I stopped doubting. The referral program has been very generous.' },
    { init: 'GC', name: 'Grace Chebet',    loc: 'Eldoret',  q: 'As a student I needed something flexible. Qezzy fits perfectly around my lectures — the tasks are simple and the platform just works.' },
  ];

  const faqs: { q: string; a: string }[] = [
    { q: 'How do I withdraw my earnings?',    a: 'Withdrawals go directly to M-Pesa or your bank. Mobile money is processed automatically; bank transfers clear within 24–48 hours.' },
    { q: 'Is the activation fee refundable?', a: "It's a one-time payment that grants lifetime access. The amount isn't returned as cash, but it's credited to your main wallet and fully withdrawable." },
    { q: 'When can I make a withdrawal?',     a: 'Main wallet withdrawals open on the 5th of each month. Your referral wallet can be withdrawn every 24 hours.' },
    { q: 'Are there hidden monthly charges?', a: 'None at all. Activation is a one-time payment. After that the platform is yours to use with no recurring fees.' },
  ];

  const marqueeItems = ['Complete Tasks', 'Refer Friends', 'Withdraw via M-Pesa', 'No Monthly Fees', 'Instant Processing'];

  return (
    <>
      <Helmet>
        <title>Qezzy Kenya — Turn Spare Time Into Real Income</title>
        <meta name="description" content="Join thousands of Kenyans earning money online. Complete simple tasks, refer friends, and withdraw instantly via M-Pesa." />
        <link rel="canonical" href="https://qezzykenya.company/" />
      </Helmet>

      <Styles />

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-bar">
          <Link to="/" className="logo" aria-label="Qezzy Kenya home">
            <div className="logo-mark">Q</div>
            <span className="logo-name">Qezzy Kenya</span>
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Stories</a>
            <Link to="/login" className="nav-cta">Get Started <ArrowRight /></Link>
          </div>
          <button className="nav-ham" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        <div className={`nav-drawer${menuOpen ? ' open' : ''}`}>
          <a href="#features"     onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#testimonials" onClick={() => setMenuOpen(false)}>Stories</a>
          <Link to="/login" className="drawer-cta" onClick={() => setMenuOpen(false)}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-wrap">
          <div>
            <div className="hero-eyebrow">
              <span className="blink-dot" />
              Trusted across Kenya
            </div>
            <h1>
              Your spare time<br />
              deserves to be<br />
              <em>paid for.</em>
            </h1>
            <p className="hero-sub">
              Qezzy is the task platform built for Kenyans.
              Complete tasks on your schedule, refer people you know,
              and withdraw straight to M-Pesa — no complexity, no waiting.
            </p>
            <div className="hero-btns">
              <Link to="/login" className="btn-amber">Start Earning <ArrowRight /></Link>
              <a href="#how-it-works" className="btn-ghost">See how it works</a>
            </div>
            <div className="hero-trust">
              <span className="trust-item"><span className="ck"><Check /></span>Free to join</span>
              <span className="trust-item"><span className="ck"><Check /></span>M-Pesa withdrawals</span>
              <span className="trust-item"><span className="ck"><Check /></span>No monthly fees</span>
            </div>
          </div>

          {/* dashboard panel — hidden on mobile */}
          <div className="hero-panel">
            <span className="panel-tag">Live Snapshot</span>
            <div className="p-big">10K</div>
            <div className="p-unit">active earners across Kenya</div>
            <div className="p-hr" />
            <div className="p-row">
              <span className="p-lbl">Tasks completed</span>
              <span className="p-val">50,000+</span>
            </div>
            <div className="p-bar"><div className="p-bar-fill" style={{ width: '76%' }} /></div>
            <div className="p-row" style={{ marginTop: 14 }}>
              <span className="p-lbl">Total paid out</span>
              <span className="badge bg-g">↑ Growing</span>
            </div>
            <div className="p-row">
              <span className="p-lbl">User rating</span>
              <span className="badge bg-a">★ 4.9 / 5</span>
            </div>
            <div className="p-row">
              <span className="p-lbl">Referral credit</span>
              <span className="p-val">Per activation</span>
            </div>
            <Link to="/login" className="p-cta">Create free account →</Link>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-row">
          {[...Array(4)].map((_, i) =>
            marqueeItems.map((item, j) => (
              <span key={`${i}-${j}`} className="m-item">
                {item}<span className="m-dot"> · </span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="sec bg-white">
        <div className="sec-in">
          <div className="feat-layout">
            <div className="feat-head">
              <span className="lbl">What you get</span>
              <h2 className="ttl">Built for <em>real</em><br />Kenyan earners</h2>
              <p className="body">
                Every feature on Qezzy exists to make earning simpler, safer,
                and more rewarding — wherever you are in the country.
              </p>
            </div>
            <div>
              {features.map((f, i) => (
                <div key={i} className="feat-item">
                  <span className="feat-n">0{i + 1}</span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="sec bg-warm">
        <div className="sec-in">
          <span className="lbl">Getting started</span>
          <h2 className="ttl">Up and earning <em>in four steps</em></h2>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card" data-n={s.n}>
                <span className="step-lbl">Step {s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 44 }}>
            <Link to="/login" className="btn-amber">Get started now <ArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* ACTIVATION */}
      <section className="sec bg-ink">
        <div className="act-in">
          <span className="lbl">One-time activation</span>
          <h2 className="ttl">Unlock everything.<br />Just once.</h2>
          <p className="act-body">
            A small one-time fee removes the barrier and opens every earning feature —
            tasks, referrals, withdrawals. No subscription, no hidden renewal.
            And the amount goes straight into your wallet.
          </p>
          <div className="pills">
            {['Lifetime access', 'All features unlocked', 'Amount credited to wallet', 'Priority support'].map((p, i) => (
              <span key={i} className="pill"><span className="ck"><Check /></span>{p}</span>
            ))}
          </div>
          <Link to="/login" className="btn-white">Activate my account <ArrowRight /></Link>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="sec bg-cream">
        <div className="sec-in">
          <span className="lbl">Real people, real results</span>
          <h2 className="ttl">What our community says</h2>
          <div className="testi-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testi-card">
                <div className="stars">{[...Array(5)].map((_, j) => <span key={j} className="star-chr">★</span>)}</div>
                <p className="testi-q">"{t.q}"</p>
                <div className="t-author">
                  <div className="avatar">{t.init}</div>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL */}
      <section className="sec bg-warm">
        <div className="sec-in">
          <div className="ref-layout">
            <div>
              <span className="lbl">Referral program</span>
              <h2 className="ttl">Every friend<br />you bring in <em>pays you.</em></h2>
              <ul className="chk-list">
                {[
                  'No cap on the number of people you can refer',
                  'Bonus credited the moment your friend activates',
                  'Referral wallet withdrawable every 24 hours',
                  'Track every referral in real time from your dashboard',
                ].map((item, i) => (
                  <li key={i}>
                    <span className="chk-icon"><Check /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-amber">Start referring <ArrowRight /></Link>
            </div>
            <div className="ref-card">
              <div className="r-lbl">Referral Bonus</div>
              <div className="r-big">Per friend</div>
              <div className="r-sub">credited on activation</div>
              <div className="r-hr" />
              <div className="code-box">
                <div>
                  <div className="code-lbl">Your referral code</div>
                  <div className="code-val">QEZZY2024</div>
                </div>
                <button className="copy-btn" onClick={copyCode}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec bg-white">
        <div className="sec-in">
          <div className="faq-layout">
            <div className="faq-head">
              <span className="lbl">FAQ</span>
              <h2 className="ttl">Common questions</h2>
              <p className="body" style={{ fontSize: 13, marginTop: 8 }}>
                Not seeing your question?<br />
                Email us at <strong>info@qezzykenya.company</strong>
              </p>
            </div>
            <div>
              {faqs.map((f, i) => (
                <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                  <button className="faq-btn" onClick={() => toggleFaq(i)}>
                    {f.q}
                    <span className="faq-arr"><ArrowRight /></span>
                  </button>
                  <div className="faq-body">{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sec bg-deep">
        <div className="cta-in">
          <span className="lbl">Ready when you are</span>
          <h2 className="ttl">Join thousands of Kenyans already <em>earning.</em></h2>
          <p className="cta-sub">
            Sign up for free, explore the platform, and activate when you're ready.
            No pressure, no expiry — your account waits for you.
          </p>
          <Link to="/login" className="btn-white" style={{ fontSize: 15, padding: '15px 34px' }}>
            Create free account <ArrowRight />
          </Link>
          <p className="cta-note">
            <span>No credit card required</span>&ensp;·&ensp;
            <span>Free to join</span>&ensp;·&ensp;
            <span>Activate when ready</span>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="logo">
              <div className="logo-mark">Q</div>
              <span className="logo-name">Qezzy Kenya</span>
            </div>
            <p>Kenya's task-earning platform. Complete tasks, earn money, and withdraw instantly via M-Pesa.</p>
          </div>
          <div>
            <h5>Navigate</h5>
            <ul>
              {['Home', 'Features', 'How It Works', 'Stories'].map(l => (
                <li key={l}><a href="#features">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/cookies">Cookies Policy</Link></li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li><span>info@qezzykenya.company</span></li>
              <li><span>+254 728 722 700</span></li>
              <li><span>Nairobi, Kenya</span></li>
            </ul>
          </div>
        </div>
        <div className="foot-btm">
          <span>© {new Date().getFullYear()} Qezzy Kenya. All rights reserved.</span>
          <span>Powered by <a href="https://dewlons.com" target="_blank" rel="noopener noreferrer">Dewlon Systems</a></span>
        </div>
      </footer>
    </>
  );
}