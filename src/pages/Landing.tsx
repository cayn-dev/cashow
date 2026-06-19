import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, LANGUAGES } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { 
  Wallet, TrendingUp, PiggyBank, BarChart3, Bell, Bot, 
  Shield, ArrowRight, Star, Zap, Globe 
} from 'lucide-react';
import { AuroraBackground } from '@/components/AuroraBackground';
import { Seo } from '@/components/Seo';


const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuestMode } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const features = [
    { icon: BarChart3, title: t('landing.feat1Title'), desc: t('landing.feat1Desc') },
    { icon: PiggyBank, title: t('landing.feat2Title'), desc: t('landing.feat2Desc') },
    { icon: Bell, title: t('landing.feat3Title'), desc: t('landing.feat3Desc') },
    { icon: Bot, title: t('landing.feat4Title'), desc: t('landing.feat4Desc') },
    { icon: Shield, title: t('landing.feat5Title'), desc: t('landing.feat5Desc') },
    { icon: Globe, title: t('landing.feat6Title'), desc: t('landing.feat6Desc') },
  ];

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
      />
      {/* Animated aurora background */}
      <AuroraBackground intensity="vivid" />


      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
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
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ ...spring, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            {t('landing.badge')}
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            {t('landing.heroTitle')}{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('landing.heroHighlight')}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('landing.heroDesc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8" onClick={() => navigate('/auth')}>
              {t('landing.createAccount')} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={handleGuestMode}>
              {t('landing.tryWithout')}
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ ...spring, delay: 0.3 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={spring}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing.featuresTitle')}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('landing.featuresDesc')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ ...spring, delay: i * 0.08 }}
              className="group p-6 rounded-2xl border border-border/50 bg-card backdrop-blur-sm hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-500">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
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
