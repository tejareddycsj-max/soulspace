import { Card } from "@/react-app/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar } from "lucide-react";

interface Entry {
  id: number;
  mood: string;
  stress: number;
  created_at: string;
}

interface InsightsGraphsProps {
  entries: Entry[];
}

const moodToScore: Record<string, number> = {
  happy: 9,
  excited: 8,
  peaceful: 7,
  calm: 6,
  frustrated: 4,
  anxious: 3,
  sad: 2,
  stressed: 1,
};

export default function InsightsGraphs({ entries }: InsightsGraphsProps) {
  if (entries.length === 0) {
    return (
      <Card className="p-6 mb-6 border-gray-200 shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Weekly Trends
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>Start writing entries to see your mood and stress trends visualized here.</p>
        </div>
      </Card>
    );
  }

  // Process data for charts (reverse to show chronological order)
  const chartData = [...entries]
    .reverse()
    .map((entry) => ({
      date: new Date(entry.created_at).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      stress: entry.stress,
      mood: moodToScore[entry.mood] || 5,
      moodLabel: entry.mood,
    }));

  // Calculate averages
  const avgStress = (
    entries.reduce((sum, e) => sum + e.stress, 0) / entries.length
  ).toFixed(1);
  const avgMood = (
    entries.reduce((sum, e) => sum + (moodToScore[e.mood] || 5), 0) /
    entries.length
  ).toFixed(1);

  return (
    <Card className="p-6 mb-6 border-gray-200 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Weekly Trends
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          Last {entries.length} {entries.length === 1 ? 'day' : 'days'}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <div className="text-sm text-emerald-600 font-medium mb-1">
            Avg Mood
          </div>
          <div className="text-3xl font-bold text-emerald-600">{avgMood}/10</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-600 font-medium mb-1">
            Avg Stress
          </div>
          <div className="text-3xl font-bold text-orange-600">{avgStress}/10</div>
        </div>
      </div>

      {/* Combined Chart */}
      <div className="mb-2">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          {payload[0].payload.date}
                        </p>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <p className="text-sm text-gray-700">
                            Mood: <span className="font-semibold">{payload[0].payload.mood}/10</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <p className="text-sm text-gray-700">
                            Stress: <span className="font-semibold">{payload[0].payload.stress}/10</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="circle"
                iconSize={8}
                content={({ payload }) => (
                  <div className="flex items-center justify-center gap-6 mt-4">
                    {payload?.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm text-gray-600">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#moodGradient)"
                dot={{ fill: "#10b981", r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
                name="Mood"
              />
              <Area
                type="monotone"
                dataKey="stress"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#stressGradient)"
                dot={{ fill: "#f97316", r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
                name="Stress"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
