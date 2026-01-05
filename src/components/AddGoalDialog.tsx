import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import { SavingsGoal } from '@/types/finance';

interface AddGoalDialogProps {
  onAdd: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
}

const EMOJI_OPTIONS = ['💻', '🏖️', '🚗', '🏠', '📱', '🎮', '👗', '💍', '🛡️', '🎓', '🏋️', '📚'];

export function AddGoalDialog({ onAdd }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [emoji, setEmoji] = useState('🎯');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    onAdd({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      emoji,
    });

    // Reset form
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setEmoji('🎯');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
          <Target className="w-4 h-4 mr-2" />
          Nuovo Obiettivo
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-card-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nuovo Obiettivo di Risparmio</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Emoji Selector */}
          <div className="space-y-2">
            <Label>Icona</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    emoji === e 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="goalName">Nome Obiettivo</Label>
            <Input
              id="goalName"
              placeholder="Es: Nuovo MacBook"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/50 border-card-border"
              required
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Importo Obiettivo (€)</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-muted/50 border-card-border text-lg font-display"
              required
            />
          </div>

          {/* Current Amount */}
          <div className="space-y-2">
            <Label htmlFor="currentAmount">Già Risparmiato (€)</Label>
            <Input
              id="currentAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="bg-muted/50 border-card-border"
            />
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Crea Obiettivo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
