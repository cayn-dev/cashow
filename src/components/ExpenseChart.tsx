import { CategoryType, CATEGORY_CONFIG } from '@/types/finance';
import { GlassCard } from './GlassCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpenseChartProps {
  data: Record<CategoryType, number>;
}

const COLORS = [
  'hsl(25, 100%, 55%)',   // food
  'hsl(200, 100%, 50%)',  // transport
  'hsl(280, 80%, 60%)',   // shopping
  'hsl(45, 100%, 50%)',   // bills
  'hsl(320, 80%, 60%)',   // entertainment
  'hsl(145, 80%, 50%)',   // health
  'hsl(0, 0%, 50%)',      // other
];

export function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_CONFIG[category as CategoryType].label,
      value,
      emoji: CATEGORY_CONFIG[category as CategoryType].emoji,
    }));

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (chartData.length === 0) {
    return (
      <GlassCard className="h-full">
        <h3 className="font-display font-semibold text-lg mb-4">Spese per Categoria</h3>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          Nessuna spesa questo mese
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full">
      <h3 className="font-display font-semibold text-lg mb-4">Spese per Categoria</h3>
      
      <div className="flex items-center gap-6">
        <div className="w-[180px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-2 text-sm">
                        <span>{data.emoji} {data.name}: €{data.value.toLocaleString()}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.emoji} {item.name}
                </span>
              </div>
              <div className="text-sm font-medium">
                €{item.value.toLocaleString()}
                <span className="text-muted-foreground ml-1">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
