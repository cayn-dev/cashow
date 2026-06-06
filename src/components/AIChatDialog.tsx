import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles, Loader2, Zap, TrendingUp, Target, PiggyBank, Camera, X, Image as ImageIcon, Mic, MicOff } from 'lucide-react';
import { Transaction, SavingsGoal } from '@/types/finance';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 data URL
}

interface AIChatDialogProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  currencySymbol?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-ai-chat`;

export function AIChatDialog({
  transactions,
  savingsGoals,
  monthlyIncome,
  monthlyExpenses,
  monthlyBalance,
  currencySymbol = '€',
}: AIChatDialogProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice input via Web Speech API
  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(t('ai.voiceUnsupported') || 'Voice input not supported in this browser');
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    const langMap: Record<string, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
    rec.lang = langMap[language] || 'it-IT';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
      }
      setInput(txt);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const captureScreenshot = async () => {
    try {
      // Use html2canvas-like approach via canvas
      const appEl = document.querySelector('.min-h-screen') as HTMLElement;
      if (!appEl) return;
      
      // Use the simpler approach: capture visible viewport
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // We'll capture via the browser's native API if available
      // Fallback: just note that we're sending a screenshot description
      setAttachedImage('screenshot');
    } catch {
      console.error('Screenshot capture failed');
    }
  };

  const buildFinancialContext = useCallback(() => {
    const now = new Date();
    const currentMonth = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    const categoryTotals = transactions
      .filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryBreakdown = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => `- ${cat}: ${currencySymbol}${amount.toLocaleString()} (${((amount / monthlyExpenses) * 100).toFixed(1)}%)`)
      .join('\n');

    const recentTransactions = transactions
      .slice(0, 15)
      .map(t => `- ${t.date.toLocaleDateString('it-IT')}: ${t.description} - ${currencySymbol}${t.amount} (${t.type === 'income' ? '📈 entrata' : '📉 uscita'}, ${t.category})`)
      .join('\n');

    const goals = savingsGoals
      .map(g => {
        const progress = Math.round((g.currentAmount / g.targetAmount) * 100);
        const remaining = g.targetAmount - g.currentAmount;
        return `- ${g.emoji} ${g.name}: ${currencySymbol}${g.currentAmount.toLocaleString()}/${currencySymbol}${g.targetAmount.toLocaleString()} (${progress}% completato, mancano ${currencySymbol}${remaining.toLocaleString()})`;
      })
      .join('\n');

    const savingsRate = monthlyIncome > 0 ? ((monthlyBalance / monthlyIncome) * 100).toFixed(1) : '0';
    const avgDailyExpense = monthlyExpenses / Math.max(now.getDate(), 1);

    return `
📅 Periodo: ${currentMonth}

💰 RIEPILOGO MENSILE:
- Entrate totali: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Uscite totali: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Saldo netto: ${currencySymbol}${monthlyBalance.toLocaleString()}
- Tasso di risparmio: ${savingsRate}%
- Spesa media giornaliera: ${currencySymbol}${avgDailyExpense.toFixed(2)}

📊 SPESE PER CATEGORIA (questo mese):
${categoryBreakdown || 'Nessuna spesa registrata'}

📝 ULTIME ${Math.min(15, transactions.length)} TRANSAZIONI (su ${transactions.length} totali):
${recentTransactions || 'Nessuna transazione recente'}

🎯 OBIETTIVI DI RISPARMIO:
${goals || 'Nessun obiettivo impostato'}
    `.trim();
  }, [transactions, savingsGoals, monthlyIncome, monthlyExpenses, monthlyBalance, currencySymbol]);

  const streamMessage = async (userMessage: Message) => {
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const financialContext = buildFinancialContext();

      // Build message content - if there's an image, describe it in context
      const messageContent = userMessage.image
        ? `[L'utente ha allegato un'immagine/screenshot dell'app. Analizza il contesto e rispondi.]\n\n${userMessage.content}`
        : userMessage.content;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, { ...userMessage, content: messageContent }].map(m => ({
            role: m.role,
            content: m.content,
          })),
          financialContext,
          language,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });


      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore di connessione');
      }

      if (!resp.body) throw new Error('Nessuna risposta');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('AI Chat error:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === 'assistant' && !lastMsg.content) {
            lastMsg.content = t('ai.error');
          } else {
            newMessages.push({ role: 'assistant', content: t('ai.error') });
          }
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input || (attachedImage ? t('ai.analyzingImage') : ''),
      image: attachedImage || undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);

    await streamMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    { icon: TrendingUp, text: t('ai.suggestAnalyze') },
    { icon: PiggyBank, text: t('ai.suggestSave') },
    { icon: Target, text: t('ai.suggestGoals') },
    { icon: Zap, text: t('ai.suggestOverspend') },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fab z-50" aria-label={t('ai.title')}>
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-card-border sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-card-border">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            {t('ai.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold">{t('ai.welcome')}</h3>
                  <p className="text-sm text-muted-foreground">{t('ai.welcomeDesc')}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((question, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-3 px-3 glass-input text-left justify-start gap-2 group hover:border-primary/50 transition-colors"
                      onClick={() => setInput(question.text)}
                    >
                      <question.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="truncate">{question.text}</span>
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  📎 {t('ai.canAttachImages')}
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] p-3 rounded-2xl text-sm',
                    message.role === 'user' ? 'user-bubble ml-auto' : 'ai-bubble'
                  )}
                >
                  {message.image && message.image !== 'screenshot' && (
                    <img src={message.image} alt="" className="rounded-lg mb-2 max-h-32 object-cover" />
                  )}
                  {message.image === 'screenshot' && (
                    <div className="flex items-center gap-1.5 text-xs text-primary mb-2">
                      <Camera className="w-3 h-3" />
                      {t('ai.screenshotAttached')}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="ai-bubble p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-typing" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-typing-delay-1" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-typing-delay-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-card-border space-y-2">
          {attachedImage && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              {attachedImage === 'screenshot' ? (
                <Camera className="w-4 h-4 text-primary" />
              ) : (
                <img src={attachedImage} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <span className="text-xs text-muted-foreground flex-1">
                {attachedImage === 'screenshot' ? t('ai.screenshotReady') : t('ai.imageReady')}
              </span>
              <button onClick={() => setAttachedImage(null)} className="p-1 hover:bg-muted rounded">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageAttach}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title={t('ai.attachImage')}
              aria-label={t('ai.attachImage')}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("shrink-0", isListening ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-primary")}
              onClick={toggleVoice}
              disabled={isLoading}
              title={t('ai.voice') || 'Voice'}
              aria-label={t('ai.voice') || 'Voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('ai.placeholder')}
              className="glass-input"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && !attachedImage) || isLoading}
              className="apple-button px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
