'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sun, Moon, ArrowRight, CheckCircle2, Zap, Shield,
  BarChart3, Users, FolderKanban, Receipt, Menu, X,
  Layers, ChevronRight, Star, Check, Minus, ChevronDown,
  Quote,
} from 'lucide-react';

/* ─── Intersection Observer hook ─────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Animated counter ────────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, inView } = useInView(0.3);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    const raf = (ts: number) => {
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Data ────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: FolderKanban, title: 'Project Boards',   desc: 'Kanban and list views for every workflow. Drag, filter, and ship faster.' },
  { icon: Users,        title: 'Client Portal',    desc: 'Give clients a secure, branded window into their project progress.' },
  { icon: Receipt,      title: 'Invoicing',        desc: 'Generate PDF invoices, track payments, and visualize revenue.' },
  { icon: Zap,          title: 'Task Automation',  desc: 'Auto-assign, deadline reminders, and status triggers built in.' },
  { icon: BarChart3,    title: 'Live Analytics',   desc: 'Real-time dashboards across all projects, clients, and team load.' },
  { icon: Shield,       title: 'Secure by Design', desc: 'Row-level security, bcrypt passwords, and SSR auth — zero shortcuts.' },
];

const STEPS = [
  { n: '01', title: 'Create a project',    desc: 'Add a client, set a budget, and spin up a project board in 30 seconds.' },
  { n: '02', title: 'Invite your team',    desc: 'Assign tasks, set priorities, and track progress in real time.' },
  { n: '03', title: 'Delight your client', desc: 'Share the portal link. Clients see exactly what you want them to see.' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen', role: 'Design Director', company: 'Studio Arc',
    quote: 'We replaced ClickUp and our entire client email chain with Nexus. The portal alone saves us 5 hours a week in status updates.',
    initials: 'SC', color: '#7c3aed',
  },
  {
    name: 'Marcus Webb', role: 'Agency Founder', company: 'Pixel & Co.',
    quote: 'Invoicing and project tracking in one place was a game changer. Revenue visibility went from quarterly guesses to real-time clarity.',
    initials: 'MW', color: '#0891b2',
  },
  {
    name: 'Aisha Patel', role: 'Product Lead', company: 'Forma Labs',
    quote: "Clients actually log in and check their portal now. We spend less time on update calls and more time building. That's the dream.",
    initials: 'AP', color: '#059669',
  },
];

const COMPARE_ROWS = [
  { feature: 'Client Portal',               nexus: true,  clickup: false, linear: false },
  { feature: 'Kanban + List Boards',        nexus: true,  clickup: true,  linear: true  },
  { feature: 'PDF Invoice Generator',       nexus: true,  clickup: false, linear: false },
  { feature: 'Revenue Analytics',           nexus: true,  clickup: false, linear: false },
  { feature: 'Dual Login (Team + Client)',  nexus: true,  clickup: false, linear: false },
  { feature: 'Row-Level Security (RLS)',    nexus: true,  clickup: false, linear: false },
  { feature: 'Custom Branding',             nexus: true,  clickup: true,  linear: false },
  { feature: 'Built-in File Storage',       nexus: true,  clickup: true,  linear: false },
];

const FAQS = [
  { q: 'Is Nexus free to use?',                     a: 'Nexus is free for small teams. Paid plans unlock advanced analytics, custom branding, and priority support. No credit card required to start.' },
  { q: 'How does the dual login work?',              a: 'Team members sign in with Supabase Auth. Clients use a separate bcrypt-hashed portal password — both from the same login page, routed automatically to the right workspace.' },
  { q: 'Can clients see internal team discussions?', a: 'No. Client-facing views are strictly filtered by Row-Level Security. Internal comments, assignees, and team data are never exposed through the portal.' },
  { q: 'How secure is my data?',                     a: 'All data is stored in Supabase PostgreSQL with RLS policies enforced at the database level. Passwords are hashed with bcrypt. Sessions use SSR cookies — never localStorage.' },
  { q: 'Can I generate PDF invoices?',               a: 'Yes. Nexus generates professional PDF invoices with your client details, line items, and branding. You can track payment status (pending, paid, overdue) per invoice.' },
  { q: 'Does it work for agencies with many clients?', a: 'Absolutely. Each client gets their own portal with filtered views of only their projects, tasks, invoices, and files. No cross-client data leakage by design.' },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const featSection   = useInView();
  const stepsSection  = useInView();
  const testiSection  = useInView();
  const cmpSection    = useInView();
  const faqSection    = useInView();
  const ctaSection    = useInView(0.2);

  // Default to dark theme before hydration to prevent blank flash
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  /* theme tokens */
  const bg      = isDark ? '#08041a'                : '#f5f3ff';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)';
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.14)';
  const textH   = isDark ? '#ffffff'                : '#180a2e';
  const textSub = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,10,46,0.5)';
  const navBg   = scrolled
    ? isDark ? 'rgba(8,4,26,0.88)' : 'rgba(245,243,255,0.88)'
    : 'transparent';

  const NAV_LINKS = ['Features', 'How it works', 'Testimonials', 'FAQ'];

  return (
    <>
      <style>{`
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(50px,-70px) scale(1.07)}70%{transform:translate(-30px,35px) scale(0.95)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-60px,45px) scale(1.05)}70%{transform:translate(40px,-20px) scale(0.97)} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,55px) scale(1.06)} }
        @keyframes hero-word  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hero-fade  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float-card { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-14px) rotate(0.5deg)} }
        @keyframes section-in { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes badge-shine{ 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes faq-open   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .orb-a { animation: orb-a 20s ease-in-out infinite; }
        .orb-b { animation: orb-b 26s ease-in-out infinite; }
        .orb-c { animation: orb-c 16s ease-in-out infinite; }

        .hero-w1    { animation: hero-word 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .hero-w2    { animation: hero-word 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .hero-w3    { animation: hero-word 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .hero-sub   { animation: hero-fade 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
        .hero-cta   { animation: hero-fade 0.6s cubic-bezier(0.16,1,0.3,1) 0.7s  both; }
        .hero-badge { animation: hero-fade 0.6s cubic-bezier(0.16,1,0.3,1) 0.0s  both; }
        .hero-mockup{ animation: hero-fade 0.8s cubic-bezier(0.16,1,0.3,1) 0.85s both; }
        .float-card { animation: float-card 7s ease-in-out infinite; }
        .section-in { animation: section-in 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .faq-open   { animation: faq-open 0.25s cubic-bezier(0.16,1,0.3,1) both; }

        .feat-card { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1), border-color 0.2s; }
        .feat-card:hover { transform: translateY(-4px); }

        .testi-card { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s; }
        .testi-card:hover { transform: translateY(-3px); }

        .badge-text {
          background: linear-gradient(90deg, #a78bfa, #7c3aed, #c4b5fd, #7c3aed, #a78bfa);
          background-size: 300% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: badge-shine 4s linear infinite;
        }
        .dot-grid {
          background-image: radial-gradient(rgba(124,58,237,0.18) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <div style={{ background: bg, minHeight: '100vh', fontFamily: 'var(--font-sans)', color: textH }}>

        {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
        <header
          className="fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-300"
          style={{
            background: navBg,
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: scrolled
              ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.1)'}`
              : '1px solid transparent',
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
              <div className="flex size-8 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 0 1px rgba(124,58,237,0.4),0 4px 16px rgba(124,58,237,0.3)' }}>
                <Layers size={15} className="text-white" />
              </div>
              <span className="text-[17px] font-semibold tracking-[-0.03em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>Nexus</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                  className="rounded-lg px-3.5 py-2 text-[13px] font-medium transition-[background-color,color] duration-150 hover:bg-violet-500/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  style={{ color: textSub }}>
                  {l}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex size-9 items-center justify-center rounded-xl transition-[background-color,transform] duration-150 hover:bg-violet-500/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                style={{ color: textSub }} aria-label="Toggle theme">
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link href="/login"
                className="hidden md:flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-[transform,box-shadow] duration-150 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                Sign in <ArrowRight size={13} />
              </Link>
              <button className="flex md:hidden size-9 items-center justify-center rounded-xl transition-[background-color] duration-150 hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                style={{ color: textSub }} onClick={() => setMenuOpen(v => !v)}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden px-6 pb-5 pt-2 space-y-1"
              style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)'}` }}>
              {NAV_LINKS.map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[14px] font-medium transition-[background-color] duration-150 hover:bg-violet-500/8"
                  style={{ color: textSub }}>{l}</a>
              ))}
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-[14px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>Sign in</Link>
            </div>
          )}
        </header>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-32 pb-24 px-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="dot-grid absolute inset-0" />
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 45%, ${bg} 100%)` }} />
            <div className="orb-a absolute -top-40 -left-32 size-[700px] rounded-full"
              style={{ background: `radial-gradient(circle at 40% 40%, ${isDark ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.18)'} 0%, transparent 65%)`, filter: 'blur(40px)' }} />
            <div className="orb-b absolute -top-20 -right-40 size-[600px] rounded-full"
              style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(99,45,220,0.4)' : 'rgba(99,45,220,0.12)'} 0%, transparent 65%)`, filter: 'blur(50px)' }} />
            <div className="orb-c absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full"
              style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.08)'} 0%, transparent 60%)`, filter: 'blur(60px)' }} />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="hero-badge mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <Star size={11} className="text-violet-400" fill="currentColor" />
              <span className="badge-text text-[12px] font-semibold tracking-wide">Nexus 2.0 — Now with client portals</span>
              <ChevronRight size={12} style={{ color: 'rgba(124,58,237,0.6)' }} />
            </div>

            <h1 className="mb-6 text-[clamp(40px,7vw,80px)] font-bold leading-[1.0] tracking-[-0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="hero-w1 block" style={{ color: textH }}>Projects that</span>
              <span className="hero-w2 block" style={{ color: textH }}>move at the</span>
              <span className="hero-w3 block"
                style={{ background: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 40%,#c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                speed of focus.
              </span>
            </h1>

            <p className="hero-sub mx-auto mb-10 max-w-[520px] text-[18px] leading-[1.7]" style={{ color: textSub }}>
              The all-in-one workspace for agencies and studios — tasks, client portals, invoicing, and analytics in one beautiful place.
            </p>

            <div className="hero-cta flex flex-wrap items-center justify-center gap-3">
              <Link href="/login"
                className="group flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-[0_8px_40px_rgba(124,58,237,0.5)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
                Get started free
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a href="#features"
                className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-semibold transition-[background-color,border-color] duration-150 hover:bg-violet-500/8 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.2)'}`, color: textH }}>
                See features
              </a>
            </div>
          </div>

          {/* Floating mockup */}
          <div className="hero-mockup relative z-10 mx-auto mt-20 max-w-3xl px-4">
            <div className="float-card">
              <div className="overflow-hidden rounded-2xl"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${cardBdr}`, backdropFilter: 'blur(20px)',
                  boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.6),0 1px 0 rgba(255,255,255,0.08) inset' : '0 32px 80px rgba(124,58,237,0.12),0 1px 0 rgba(255,255,255,0.9) inset',
                }}>
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)'}` }}>
                  {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />)}
                  <div className="mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px]"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.05)', color: textSub }}>
                    nexus.app/dashboard
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="h-3 w-32 rounded-full mb-1.5" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.12)' }} />
                      <div className="h-2 w-20 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.07)' }} />
                    </div>
                    <div className="rounded-lg px-3 py-1.5 text-[11px] font-semibold" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>+ New Task</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[['12','Total Tasks','#7c3aed'],['3','Overdue','#ef4444'],['5','Due This Week','#f59e0b']].map(([v,l,c]) => (
                      <div key={l} className="rounded-xl p-3"
                        style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.08)'}` }}>
                        <div className="text-[22px] font-bold" style={{ color: c }}>{v}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: textSub }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[['Design system audit','In Progress','#f59e0b'],['Client portal setup','Done','#22c55e'],['Invoice Q1 2025','To Do','#6b7280']].map(([t,s,c]) => (
                      <div key={t} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.07)'}` }}>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: c }} />
                        <span className="flex-1 text-[12px]" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#2d1a4e' }}>{t}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${c}18`, color: c }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────────────────────────── */}
        <section className="py-14 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-3 rounded-2xl overflow-hidden"
              style={{ background: cardBg, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(12px)', boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.3)' : '0 4px 32px rgba(124,58,237,0.08)' }}>
              {[
                { n: 12000, s: '+',       label: 'Tasks managed' },
                { n: 99,   s: '.9%',     label: 'Uptime SLA' },
                { n: 2,    s: '× faster', label: 'Than ClickUp' },
              ].map(({ n, s, label }, i) => (
                <div key={label} className="py-8 text-center px-4"
                  style={{ borderLeft: i > 0 ? `1px solid ${cardBdr}` : 'none' }}>
                  <p className="text-[36px] font-bold tracking-[-0.04em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                    <Counter to={n} suffix={s} />
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: textSub }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────────────── */}
        <section id="features" className="py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <div ref={featSection.ref}
              className={`text-center mb-16 ${featSection.inView ? 'section-in' : ''}`}>
              <p className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-500">Features</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                Everything your team needs
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] mx-auto max-w-[440px]" style={{ color: textSub }}>
                No more juggling between tools. Nexus consolidates your entire workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <div key={title}
                  className={`feat-card rounded-2xl p-6 ${featSection.inView ? 'section-in' : ''}`}
                  style={{ background: cardBg, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(12px)', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(124,58,237,0.06)', animationDelay: `${i * 70}ms` }}>
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(124,58,237,0.12)', boxShadow: '0 0 0 1px rgba(124,58,237,0.2)' }}>
                    <Icon size={19} style={{ color: '#a78bfa' }} />
                  </div>
                  <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.02em]" style={{ color: textH }}>{title}</h3>
                  <p className="text-[13px] leading-[1.65]" style={{ color: textSub }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <div ref={stepsSection.ref} className={`text-center mb-16 ${stepsSection.inView ? 'section-in' : ''}`}>
              <p className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-500">Process</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                Up and running in minutes
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className={`relative ${stepsSection.inView ? 'section-in' : ''}`}
                  style={{ animationDelay: `${i * 100}ms` }}>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 h-px"
                      style={{ left: 'calc(100% + 8px)', width: 'calc(100% - 16px)', background: `linear-gradient(90deg, ${isDark ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.2)'}, transparent)` }} />
                  )}
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl text-[13px] font-bold"
                    style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(91,33,182,0.15))', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontFamily: 'var(--font-display)' }}>
                    {n}
                  </div>
                  <h3 className="mb-2 text-[16px] font-semibold tracking-[-0.02em]" style={{ color: textH }}>{title}</h3>
                  <p className="text-[13px] leading-[1.65]" style={{ color: textSub }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
        <section id="testimonials" className="py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <div ref={testiSection.ref} className={`text-center mb-16 ${testiSection.inView ? 'section-in' : ''}`}>
              <p className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-500">Testimonials</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                Loved by teams who ship
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] mx-auto max-w-[400px]" style={{ color: textSub }}>
                Real teams. Real workflows. Real results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ name, role, company, quote, initials, color }, i) => (
                <div key={name}
                  className={`testi-card rounded-2xl p-6 flex flex-col gap-5 ${testiSection.inView ? 'section-in' : ''}`}
                  style={{ background: cardBg, border: `1px solid ${cardBdr}`, backdropFilter: 'blur(12px)', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(124,58,237,0.06)', animationDelay: `${i * 80}ms` }}>
                  {/* Quote icon */}
                  <Quote size={20} style={{ color: 'rgba(124,58,237,0.4)' }} />

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} size={13} className="text-violet-400" fill="currentColor" />)}
                  </div>

                  <p className="flex-1 text-[14px] leading-[1.7]" style={{ color: textSub }}>&quot;{quote}&quot;</p>

                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: `1px solid ${cardBdr}` }}>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style={{ background: color, boxShadow: `0 0 0 2px ${color}30` }}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: textH }}>{name}</p>
                      <p className="text-[11px]" style={{ color: textSub }}>{role} · {company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON ──────────────────────────────────────────────────── */}
        <section id="comparison" className="py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <div ref={cmpSection.ref} className={`text-center mb-16 ${cmpSection.inView ? 'section-in' : ''}`}>
              <p className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-500">Comparison</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                Why teams switch to Nexus
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] mx-auto max-w-[400px]" style={{ color: textSub }}>
                Purpose-built for client-facing studios — not a generic task app.
              </p>
            </div>

            <div className={`overflow-hidden rounded-2xl ${cmpSection.inView ? 'section-in' : ''}`}
              style={{ border: `1px solid ${cardBdr}`, backdropFilter: 'blur(12px)', boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.3)' : '0 8px 40px rgba(124,58,237,0.08)' }}>
              {/* Header row */}
              <div className="grid grid-cols-4 text-[12px] font-semibold"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(124,58,237,0.04)', borderBottom: `1px solid ${cardBdr}` }}>
                <div className="px-5 py-4" style={{ color: textSub }}>Feature</div>
                {[
                  { label: 'Nexus',   highlight: true  },
                  { label: 'ClickUp', highlight: false },
                  { label: 'Linear',  highlight: false },
                ].map(({ label, highlight }) => (
                  <div key={label} className="px-4 py-4 text-center"
                    style={{
                      color: highlight ? '#a78bfa' : textSub,
                      background: highlight ? (isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.06)') : 'transparent',
                      borderLeft: `1px solid ${cardBdr}`,
                    }}>
                    {highlight && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-violet-400 align-middle" />}
                    {label}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {COMPARE_ROWS.map(({ feature, nexus, clickup, linear }, i) => (
                <div key={feature}
                  className="grid grid-cols-4 text-[13px] transition-[background-color] duration-100 hover:bg-violet-500/4"
                  style={{ borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${cardBdr}` : 'none', background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.5)' }}>
                  <div className="px-5 py-3.5 font-medium" style={{ color: textH }}>{feature}</div>
                  {[nexus, clickup, linear].map((has, j) => (
                    <div key={j} className="flex items-center justify-center py-3.5"
                      style={{
                        borderLeft: `1px solid ${cardBdr}`,
                        background: j === 0 ? (isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)') : 'transparent',
                      }}>
                      {has
                        ? <Check size={16} className="text-violet-500" strokeWidth={2.5} />
                        : <Minus size={14} style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section id="faq" className="py-24 px-6">
          <div className="mx-auto max-w-2xl">
            <div ref={faqSection.ref} className={`text-center mb-16 ${faqSection.inView ? 'section-in' : ''}`}>
              <p className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-violet-500">FAQ</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                Questions answered
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map(({ q, a }, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i}
                    className={`overflow-hidden rounded-2xl transition-[border-color] duration-200 ${faqSection.inView ? 'section-in' : ''}`}
                    style={{ background: cardBg, border: `1px solid ${isOpen ? 'rgba(124,58,237,0.35)' : cardBdr}`, backdropFilter: 'blur(12px)', animationDelay: `${i * 60}ms` }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left transition-[background-color] duration-150 hover:bg-violet-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/40"
                    >
                      <span className="text-[14px] font-semibold pr-4" style={{ color: textH }}>{q}</span>
                      <ChevronDown size={16}
                        className="shrink-0 transition-transform duration-300"
                        style={{ color: isOpen ? '#a78bfa' : textSub, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {isOpen && (
                      <div className="faq-open px-5 pb-5">
                        <p className="text-[14px] leading-[1.7]" style={{ color: textSub }}>{a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <div ref={ctaSection.ref}
              className={`relative overflow-hidden rounded-3xl px-8 py-16 text-center ${ctaSection.inView ? 'section-in' : ''}`}
              style={{
                background: isDark ? 'linear-gradient(135deg,#1a0a3e 0%,#0d0618 50%,#0f0528 100%)' : 'linear-gradient(135deg,#ede9fe 0%,#f5f3ff 50%,#ede9fe 100%)',
                border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)'}`,
                boxShadow: isDark ? '0 0 80px rgba(124,58,237,0.2)' : '0 0 80px rgba(124,58,237,0.08)',
              }}>
              <div className="orb-c pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-[400px] rounded-full"
                style={{ background: `radial-gradient(circle,${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.12)'} 0%,transparent 60%)`, filter: 'blur(50px)' }} />

              <div className="relative z-10">
                <div className="mb-2 flex justify-center">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-violet-400 mx-0.5" fill="currentColor" />)}
                </div>
                <p className="mb-6 text-[13px]" style={{ color: textSub }}>Loved by teams at 200+ studios worldwide</p>
                <h2 className="mb-4 text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.04em]" style={{ color: textH, fontFamily: 'var(--font-display)' }}>
                  Ready to ship faster?
                </h2>
                <p className="mb-10 text-[16px] leading-[1.7] mx-auto max-w-[400px]" style={{ color: textSub }}>
                  Join your team on Nexus and never lose track of a task, invoice, or client again.
                </p>
                <Link href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-[15px] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-[0_8px_48px_rgba(124,58,237,0.55)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
                  Get started — it&apos;s free <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer
          className="relative overflow-hidden px-6 pt-16 pb-8"
          style={{
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.1)'}`,
            background: isDark
              ? 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.04))'
              : 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.03))',
          }}
        >
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full"
            style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(124,58,237,0.07)' : 'rgba(124,58,237,0.04)'} 0%, transparent 65%)`, filter: 'blur(60px)' }} />

          <div className="relative mx-auto max-w-6xl">

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5 mb-14">

              {/* Brand column — spans 2 */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 0 1px rgba(124,58,237,0.4),0 6px 24px rgba(124,58,237,0.35)' }}>
                    <Layers size={16} className="text-white" />
                  </div>
                  <span className="text-[18px] font-semibold tracking-[-0.03em]"
                    style={{ color: textH, fontFamily: 'var(--font-display)' }}>Nexus</span>
                </div>
                <p className="max-w-[260px] text-[14px] leading-[1.7]" style={{ color: textSub }}>
                  The all-in-one workspace for agencies and studios. Tasks, clients, invoicing — beautifully unified.
                </p>

                {/* Social icons */}
                <div className="flex items-center gap-2">
                  {[
                    {
                      label: 'Twitter / X',
                      href: '#',
                      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.623zm-1.161 17.52h1.833L7.084 4.126H5.117z',
                    },
                    {
                      label: 'GitHub',
                      href: '#',
                      path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
                    },
                    {
                      label: 'LinkedIn',
                      href: '#',
                      path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
                    },
                    {
                      label: 'Instagram',
                      href: '#',
                      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
                    },
                  ].map(({ label, href, path }) => (
                    <a key={label} href={href} aria-label={label}
                      className="flex size-9 items-center justify-center rounded-xl transition-[background-color,transform,box-shadow] duration-150 hover:scale-110 hover:bg-violet-500/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                      style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.12)'}`, color: textSub }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                        <path d={path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Link columns */}
              {[
                {
                  title: 'Product',
                  links: [
                    { label: 'Features',     href: '#features'      },
                    { label: 'How it works', href: '#how-it-works'  },
                    { label: 'Testimonials', href: '#testimonials'  },
                    { label: 'FAQ',          href: '#faq'           },
                  ],
                },
                {
                  title: 'Workspace',
                  links: [
                    { label: 'Dashboard',     href: '/login' },
                    { label: 'Client Portal', href: '/login' },
                    { label: 'Invoicing',     href: '/login' },
                    { label: 'Analytics',     href: '/login' },
                  ],
                },
                {
                  title: 'Legal',
                  links: [
                    { label: 'Privacy Policy', href: '#' },
                    { label: 'Terms of Use',   href: '#' },
                    { label: 'Security',       href: '#' },
                    { label: 'Cookie Policy',  href: '#' },
                  ],
                },
              ].map(({ title, links }) => (
                <div key={title} className="space-y-4">
                  <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-violet-500">{title}</h4>
                  <ul className="space-y-2.5">
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <a href={href}
                          className="text-[13px] transition-[color] duration-150 hover:text-violet-500 focus-visible:outline-none"
                          style={{ color: textSub }}>
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
              style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)'}` }}>
              <p className="text-[12px]" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(24,10,46,0.35)' }}>
                © 2025 Nexus. All rights reserved.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[12px]" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(24,10,46,0.35)' }}>
                  All systems operational
                </span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
