import { useState, useRef, useEffect } from 'react';
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
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { Transaction, SavingsGoal } from '@/types/finance';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatDialogProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  currencySymbol?: string;
}

export function AIChatDialog({
  transactions,
  savingsGoals,
  monthlyIncome,
  monthlyExpenses,
  monthlyBalance,
  currencySymbol = '€',
}: AIChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildFinancialContext = () => {
    const now = new Date();
    const currentMonth = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    
    const recentTransactions = transactions
      .slice(0, 10)
      .map(t => `- ${t.description}: ${currencySymbol}${t.amount} (${t.type === 'income' ? 'entrata' : 'uscita'}, ${t.category})`)
      .join('\n');

    const goals = savingsGoals
      .map(g => `- ${g.emoji} ${g.name}: ${currencySymbol}${g.currentAmount}/${currencySymbol}${g.targetAmount} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`)
      .join('\n');

    return `
Dati finanziari dell'utente per ${currentMonth}:
- Entrate mensili: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Uscite mensili: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Saldo mensile: ${currencySymbol}${monthlyBalance.toLocaleString()}

Ultime transazioni:
${recentTransactions || 'Nessuna transazione recente'}

Obiettivi di risparmio:
${goals || 'Nessun obiettivo impostato'}
    `.trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const financialContext = buildFinancialContext();
      
      const response = await supabase.functions.invoke('finance-ai-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          financialContext,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message || 'Mi dispiace, non sono riuscito a elaborare la risposta.',
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    'Come posso risparmiare di più?',
    'Analizza le mie spese',
    'Consigli per raggiungere i miei obiettivi',
    'Dove sto spendendo troppo?',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fab z-50" aria-label="Assistente AI">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-card-border sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-card-border">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            Assistente Finanziario AI
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
                  <h3 className="font-display font-semibold">Ciao! Sono il tuo assistente finanziario</h3>
                  <p className="text-sm text-muted-foreground">
                    Posso aiutarti ad analizzare le tue finanze, darti consigli personalizzati e suggerimenti per risparmiare.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((question, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3 glass-input text-left justify-start"
                      onClick={() => {
                        setInput(question);
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
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
                    message.role === 'user'
                      ? 'user-bubble ml-auto'
                      : 'ai-bubble'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
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
        
        <div className="p-4 border-t border-card-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chiedi qualcosa sulle tue finanze..."
              className="glass-input"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
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
