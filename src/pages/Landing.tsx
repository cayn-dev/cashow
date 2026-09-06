import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, LANGUAGES } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import {
  Wallet, TrendingUp, PiggyBank, BarChart3, Bell, Bot,
  Shield, ArrowRight, Star, Zap, Globe, UtensilsCrossed, Briefcase, ShoppingCart,
  Sparkles, Lock, MessageSquare, Languages
} from 'lucide-react';
import { AuroraBackground } from '@/components/AuroraBackground';
import { Seo } from '@/components/Seo';
import cashowLogo from '@/assets/cashow-logo-v2.png.asset.json';



const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuestMode } = useAuth();
  const { t, language, setLanguage } = useLanguage();


  const stats = [
    { value: '100%', label: t('landing.statFree') },
    { value: '5', label: t('landing.statLangs') },
    { value: '∞', label: t('landing.statTransactions') },
    { value: '24/7', label: t('landing.statAvailable') },
  ];

  const handleGuestMode = () => {
    enterGuestMode();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <Seo
        title="Cashow — Inizia gratis a gestire le tue finanze"
        description="Scopri Cashow: l'app gratuita per tracciare spese, monitorare risparmi e raggiungere i tuoi obiettivi finanziari. Provala senza registrazione."
        path="/welcome"
        image="/welcome-cover.png"
        imageAlt="Cashow — app di finanza personale"
      />
      {/* Animated aurora background */}
      <AuroraBackground intensity="vivid" />


      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 shrink-0">
          <img src={cashowLogo.url} alt="Cashow" className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10" />
          <span className="font-bold text-lg hidden sm:inline">Cashow</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {/* Language selector */}
          <div className="flex items-center gap-0.5 bg-card/80 backdrop-blur-sm border border-border rounded-xl p-0.5 mr-1 sm:mr-2 shrink-0">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-300 ${
                  language === lang.code
                    ? 'bg-primary/20 text-primary scale-110'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 shrink-0" onClick={() => navigate('/auth')}>
            {t('landing.login')}
          </Button>
          <Button size="sm" className="hidden sm:inline-flex text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigate('/auth')}>
            {t('landing.startFree')} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      <main id="main-content">
      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ ...spring, delay: 0.1 }}
            className="text-center lg:text-left"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0)', '0 0 24px hsl(var(--primary) / 0.35)', '0 0 0px hsl(var(--primary) / 0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
            >
              <Zap className="w-3.5 h-3.5" />
              {t('landing.badge')}
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] mb-6">
              {t('landing.heroTitle')}{' '}
              <motion.span
                className="inline-block bg-gradient-to-r from-primary via-primary/70 to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                {t('landing.heroHighlight')}
              </motion.span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10">
              {t('landing.heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
              <Button
                size="lg"
                className="text-base px-8 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_12px_48px_-8px_hsl(var(--primary)/0.8)] transition-shadow duration-300"
                onClick={() => navigate('/auth')}
              >
                {t('landing.createAccount')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={handleGuestMode}>
                {t('landing.tryWithout')}
              </Button>
            </div>
          </motion.div>

          {/* Live app preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.25 }}
            className="relative mx-auto w-full max-w-sm"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="glass-panel-elevated rounded-3xl p-6 space-y-5 ring-1 ring-white/10"
            >
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Cashow</p>
                <p className="text-4xl font-bold tabular-nums">€ 2.840,50</p>
                <p className="text-sm text-emerald-400 font-medium">▲ +12,4% questo mese</p>
              </div>
              {/* Animated bar chart */}
              <div className="flex items-end gap-2 h-24">
                {[35, 55, 40, 70, 52, 88, 64].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-lg bg-gradient-to-t from-primary/30 to-primary"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 120, damping: 18 }}
                  />
                ))}
              </div>
              {/* Sample transactions */}
              <div className="space-y-2.5">
                {[
                  { Icon: UtensilsCrossed, label: 'Pizzeria Da Mario', amt: '-€18,00' },
                  { Icon: Briefcase, label: 'Stipendio', amt: '+€1.950,00' },
                  { Icon: ShoppingCart, label: 'Supermercato', amt: '-€64,30' },
                ].map((tx, i) => (
                  <motion.div
                    key={tx.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + i * 0.15 }}
                    className="flex items-center gap-3 rounded-xl bg-card/60 border border-border/40 px-3 py-2.5"
                  >
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <tx.Icon className="w-4 h-4 text-primary" />
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{tx.label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${tx.amt.startsWith('+') ? 'text-emerald-400' : 'text-foreground'}`}>
                      {tx.amt}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Floating chips */}
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-3 sm:-right-6 glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-2 ring-1 ring-white/10"
            >
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">AI Insights</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-5 -left-3 sm:-left-6 glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-2 ring-1 ring-white/10"
            >
              <PiggyBank className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">Obiettivi smart</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ ...spring, delay: 0.2 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              className="text-center glass-panel rounded-2xl py-5 px-3"
            >
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features — Bento grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={spring}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0)', '0 0 20px hsl(var(--primary) / 0.25)', '0 0 0px hsl(var(--primary) / 0)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('landing.badge')}
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-shine">{t('landing.featuresTitle')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('landing.featuresDesc')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[minmax(220px,auto)]">
          {/* AI Assistant — large spotlight card */}
          <motion.div
            onMouseMove={spotlight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...spring, delay: 0 }}
            className="bento-card lg:row-span-2 group"
          >
            <div className="shine" />
            <div className="bento-icon">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('landing.feat4Title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t('landing.feat4Desc')}</p>

            <div className="space-y-3 mt-auto">
              <div className="ai-bubble rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm inline-block">
                <MessageSquare className="w-3.5 h-3.5 inline mr-1.5 text-primary/70" />
                {language === 'it' ? 'Come posso risparmiare di più?' : 'How can I save more?'}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, ...spring }}
                className="flex items-center gap-1.5 px-4 py-2.5 ai-bubble rounded-2xl rounded-tl-sm w-fit"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '120ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '240ms' }} />
              </motion.div>
            </div>

            <Sparkles className="absolute top-6 right-6 w-5 h-5 text-primary/60 animate-pulse" />
          </motion.div>

          {/* Smart Charts — wide card */}
          <motion.div
            onMouseMove={spotlight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...spring, delay: 0.08 }}
            className="bento-card md:col-span-2 group"
          >
            <div className="shine" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="bento-icon">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('landing.feat1Title')}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-md">{t('landing.feat1Desc')}</p>
              </div>
              <div className="flex items-end gap-2 h-20 sm:h-24 w-full sm:w-56">
                {[35, 55, 40, 70, 52, 88, 64].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                    className="flex-1 bento-mini-bar rounded-md"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Savings Goals */}
          <motion.div
            onMouseMove={spotlight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...spring, delay: 0.16 }}
            className="bento-card group"
          >
            <div className="shine" />
            <div className="bento-icon">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.feat2Title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('landing.feat2Desc')}</p>
            <div className="relative w-20 h-20 mx-auto mt-5">
              <div className="bento-ring absolute inset-0" style={{ '--progress': '280deg' } as React.CSSProperties} />
              <div className="absolute inset-2 rounded-full bg-card/60 backdrop-blur-sm flex items-center justify-center border border-border/40">
                <span className="text-lg font-bold text-primary">78%</span>
              </div>
            </div>
          </motion.div>

          {/* Smart Notifications */}
          <motion.div
            onMouseMove={spotlight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...spring, delay: 0.24 }}
            className="bento-card group"
          >
            <div className="shine" />
            <div className="bento-icon">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.feat3Title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('landing.feat3Desc')}</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/15">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_hsl(var(--success))]" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-xs text-muted-foreground">{t('landing.feat3Title')}</span>
            </div>
          </motion.div>

          {/* Secure & Private */}
          <motion.div
            onMouseMove={spotlight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...spring, delay: 0.32 }}
            className="bento-card group"
          >
            <div className="shine" />
            <div className="bento-icon">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.feat5Title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('landing.feat5Desc')}</p>
            <div className="mt-5 flex items-center justify-center">
              <div className="relative w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                <Shield className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-[pulse-ring_2s_ease-out_infinite]" />
                <Lock className="absolute bottom-3 right-3 w-4 h-4 text-primary/80" />
              </div>
            </div>
          </motion.div>

          {/* Multi-language */}
          <motion.div
            onMouseMove={spotlight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...spring, delay: 0.40 }}
            className="bento-card md:col-span-2 lg:col-span-1 group"
          >
            <div className="shine" />
            <div className="bento-icon">
              <Languages className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.feat6Title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('landing.feat6Desc')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['IT', 'EN', 'ES', 'FR', 'DE'].map((lang, i) => (
                <motion.span
                  key={lang}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.06, ...spring }}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                >
                  {lang}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={spring}
          className="p-10 sm:p-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5"
        >
          <Star className="w-10 h-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            {t('landing.ctaDesc')}
          </p>
          <Button size="lg" className="text-base px-10" onClick={() => navigate('/auth')}>
            {t('landing.ctaButton')} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="w-4 h-4" />
              <span>© 2026 Cashow. {t('landing.rights')}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.privacy')}</a>
              <a href="/auth" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.login')}</a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2">Made by Jacopo Ferrieri</p>
        </div>
      </footer>
    </div>
  );
}
