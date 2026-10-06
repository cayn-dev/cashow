import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

// Must match public/version.json "version" of this build. Bump both when shipping changes.
export const APP_VERSION = '2026.10.06';

const COPY: Record<string, { title: string; desc: string; btn: string; later: string }> = {
  it: { title: 'Nuovo aggiornamento disponibile', desc: 'Ecco le novità:', btn: 'Aggiorna ora', later: 'Più tardi' },
  en: { title: 'New update available', desc: "Here's what's new:", btn: 'Update now', later: 'Later' },
  es: { title: 'Nueva actualización disponible', desc: 'Estas son las novedades:', btn: 'Actualizar ahora', later: 'Más tarde' },
  fr: { title: 'Nouvelle mise à jour disponible', desc: 'Voici les nouveautés :', btn: 'Mettre à jour', later: 'Plus tard' },
  de: { title: 'Neues Update verfügbar', desc: 'Das ist neu:', btn: 'Jetzt aktualisieren', later: 'Später' },
};

type Remote = { version: string; notes: Record<string, string[]> };

const SEEN_KEY = 'cashow-seen-version';

const NEW_COPY: Record<string, { title: string; ok: string }> = {
  it: { title: 'App aggiornata', ok: 'Ho capito' },
  en: { title: 'App updated', ok: 'Got it' },
  es: { title: 'App actualizada', ok: 'Entendido' },
  fr: { title: 'Application mise à jour', ok: "J'ai compris" },
  de: { title: 'App aktualisiert', ok: 'Verstanden' },
};

export function UpdatePrompt() {
  const { language } = useLanguage();
  const [remote, setRemote] = useState<Remote | null>(null);
  const [open, setOpen] = useState(false);
  // 'update' = a newer version is online (reload needed); 'news' = this version is new for this device
  const [mode, setMode] = useState<'update' | 'news'>('update');

  useEffect(() => {
    let cancelled = false;
    const force = new URLSearchParams(window.location.search).has('test-update');
    const check = async (onOpen = false) => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: Remote = await res.json();
        if (cancelled || !data?.version) return;
        if (data.version !== APP_VERSION) {
          if (!force && sessionStorage.getItem('update-dismissed') === data.version) return;
          setMode('update');
          setRemote(data);
          setOpen(true);
          return;
        }
        // Running the latest version: on app open, show what's new once per version.
        if (onOpen && (force || localStorage.getItem(SEEN_KEY) !== APP_VERSION)) {
          setMode('news');
          setRemote(data);
          setOpen(true);
        }
      } catch { /* offline */ }
    };
    check(true);
    const id = setInterval(() => check(), 5 * 60 * 1000);
    const onVis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const close = () => {
    setOpen(false);
    if (!remote) return;
    if (mode === 'news') localStorage.setItem(SEEN_KEY, APP_VERSION);
    else sessionStorage.setItem('update-dismissed', remote.version);
  };

  const update = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((regs ?? []).map((r) => r.update().catch(() => {})));
    } finally {
      window.location.reload();
    }
  };

  if (!remote) return null;
  const c = COPY[language] ?? COPY.it;
  const n = NEW_COPY[language] ?? NEW_COPY.it;
  const notes = remote.notes[language] ?? remote.notes.it ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) sessionStorage.setItem('update-dismissed', remote.version); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{c.title}</DialogTitle>
          <DialogDescription className="text-center">{c.desc}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span>{n}</li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col gap-2">
          <Button onClick={update} className="w-full"><RefreshCw className="mr-2 h-4 w-4" />{c.btn}</Button>
          <Button variant="ghost" onClick={() => { setOpen(false); sessionStorage.setItem('update-dismissed', remote.version); }}>{c.later}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
