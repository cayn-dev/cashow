import { Shield, Lock, Database, Eye, Trash2, Server, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Seo } from '@/components/Seo';


const Privacy = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const sections = [
    {
      icon: Lock,
      title: t('privacy.encryption'),
      items: [
        t('privacy.encryption1'),
        t('privacy.encryption2'),
        t('privacy.encryption3'),
        t('privacy.encryption4'),
      ],
    },
    {
      icon: Database,
      title: t('privacy.storage'),
      items: [
        t('privacy.storage1'),
        t('privacy.storage2'),
        t('privacy.storage3'),
        t('privacy.storage4'),
      ],
    },
    {
      icon: Eye,
      title: t('privacy.transparency'),
      items: [
        t('privacy.transparency1'),
        t('privacy.transparency2'),
        t('privacy.transparency3'),
        t('privacy.transparency4'),
      ],
    },
    {
      icon: Shield,
      title: t('privacy.access'),
      items: [
        t('privacy.access1'),
        t('privacy.access2'),
        t('privacy.access3'),
        t('privacy.access4'),
      ],
    },
    {
      icon: Trash2,
      title: t('privacy.rights'),
      items: [
        t('privacy.rights1'),
        t('privacy.rights2'),
        t('privacy.rights3'),
        t('privacy.rights4'),
      ],
    },
    {
      icon: Server,
      title: t('privacy.infrastructure'),
      items: [
        t('privacy.infrastructure1'),
        t('privacy.infrastructure2'),
        t('privacy.infrastructure3'),
        t('privacy.infrastructure4'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container max-w-3xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('privacy.back')}
        </Button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{t('privacy.title')}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('privacy.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <GlassCard key={idx} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-2 ml-13">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        <div className="text-center mt-10 text-sm text-muted-foreground">
          <p>{t('privacy.lastUpdate')}</p>
          <p className="mt-1">{t('privacy.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
