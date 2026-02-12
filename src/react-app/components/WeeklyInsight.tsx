import { useEffect, useState } from "react";
import { Card } from "@/react-app/components/ui/card";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

export default function WeeklyInsight() {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInsight = async () => {
    try {
      const response = await fetch("/api/insights/weekly");
      if (response.ok) {
        const data = await response.json();
        setInsight(data.insight);
      }
    } catch (error) {
      console.error("Error loading insight:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsight();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInsight();
  };

  if (isLoading || !insight) {
    return null;
  }

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-amber-900">
              Weekly Insight
            </h3>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
              className="h-8 hover:bg-amber-100"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {insight}
          </p>
        </div>
      </div>
    </Card>
  );
}
