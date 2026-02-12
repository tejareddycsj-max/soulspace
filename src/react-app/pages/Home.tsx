import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Textarea } from "@/react-app/components/ui/textarea";
import { Card } from "@/react-app/components/ui/card";
import { Badge } from "@/react-app/components/ui/badge";
import { Slider } from "@/react-app/components/ui/slider";
import { PenLine, Sparkles, TrendingUp, Loader2, LogOut, LogIn, User } from "lucide-react";
import InsightsGraphs from "@/react-app/components/InsightsGraphs";
import WeeklyInsight from "@/react-app/components/WeeklyInsight";
import { useAuth } from "@getmocha/users-service/react";

// Stub data for demonstration
const stubEntries = [
  {
    id: 1,
    content: "Today was an amazing day! I finally finished that project I've been working on for weeks. The feeling of accomplishment is incredible.",
    mood: "happy",
    stress: 2,
    ai_insights: "Your entry reflects a strong sense of achievement and positive energy. Consider celebrating this milestone and acknowledging your hard work.",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    content: "Feeling a bit overwhelmed with everything going on. Work is piling up and I'm struggling to find time for myself.",
    mood: "anxious",
    stress: 7,
    ai_insights: "It seems you're experiencing stress from workload. Remember to prioritize self-care and consider breaking tasks into smaller, manageable steps.",
    created_at: "2024-01-14T18:45:00Z",
  },
  {
    id: 3,
    content: "Had a peaceful morning walk in the park. The fresh air and sunshine really helped clear my mind.",
    mood: "calm",
    stress: 3,
    ai_insights: "Nature and physical activity are excellent for mental wellness. Your entry shows you're finding healthy ways to manage stress.",
    created_at: "2024-01-13T08:15:00Z",
  },
];

const moodColors: Record<string, string> = {
  happy: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  anxious: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  calm: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  sad: "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

export default function Home() {
  const { user, redirectToLogin, logout, isPending } = useAuth();
  const [newEntry, setNewEntry] = useState("");
  const [moodRating, setMoodRating] = useState([5]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [entries, setEntries] = useState<typeof stubEntries>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load entries on mount and when user changes
  useEffect(() => {
    if (isPending) return;
    
    async function loadEntries() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/entries");
        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        }
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadEntries();
  }, [user, isPending]);

  const handleSubmit = async () => {
    if (!newEntry.trim()) return;

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newEntry,
          user_mood_rating: moodRating[0]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create entry");
        setIsAnalyzing(false);
        return;
      }

      const newEntryObj = await response.json();
      setEntries([newEntryObj, ...entries]);
      setNewEntry("");
      setMoodRating([5]);
      setShowNewEntry(false);
    } catch (error) {
      console.error("Error creating entry:", error);
      alert("Failed to create entry. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PenLine className="w-8 h-8 text-violet-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                MindScribe
              </h1>
            </div>
            {!isPending && (
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <Button
                      onClick={logout}
                      variant="outline"
                      size="sm"
                      className="border-violet-200 hover:bg-violet-50"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={redirectToLogin}
                    variant="outline"
                    size="sm"
                    className="border-violet-200 hover:bg-violet-50"
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In
                  </Button>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600 text-center">
            Your AI-powered sentimental diary
            {!user && (
              <span className="block text-sm mt-1 text-violet-600">
                Sign in to sync your entries across devices
              </span>
            )}
          </p>
        </div>

        {/* New Entry Button */}
        {!showNewEntry && (
          <Button
            onClick={() => setShowNewEntry(true)}
            className="w-full mb-6 h-14 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
          >
            <PenLine className="w-5 h-5 mr-2" />
            Write New Entry
          </Button>
        )}

        {/* New Entry Form */}
        {showNewEntry && (
          <Card className="p-6 mb-6 border-2 border-violet-200 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              How are you feeling today?
            </h2>
            <Textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Write about your day, thoughts, and feelings..."
              className="min-h-[200px] mb-4 text-base border-violet-200 focus:border-violet-400"
            />
            <div className="mb-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate your mood: <span className="text-violet-600 font-semibold">{moodRating[0]}/10</span>
              </label>
              <Slider
                value={moodRating}
                onValueChange={setMoodRating}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>😔 Low</span>
                <span>😊 High</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!newEntry.trim() || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save & Analyze
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowNewEntry(false);
                  setNewEntry("");
                  setMoodRating([5]);
                }}
                variant="outline"
                className="border-violet-200 hover:bg-violet-50"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Weekly Insight - AI coaching */}
        {!isLoading && entries.length >= 3 && <WeeklyInsight />}

        {/* Insights Graphs - Always visible */}
        {!isLoading && <InsightsGraphs entries={entries} />}

        {/* Entries List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Your Journal
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : entries.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-violet-200">
              <PenLine className="w-12 h-12 mx-auto mb-4 text-violet-400" />
              <p className="text-gray-600 text-lg">
                No entries yet. Start writing to capture your thoughts!
              </p>
            </Card>
          ) : (
            entries.map((entry) => (
            <Card
              key={entry.id}
              className="p-6 hover:shadow-lg transition-shadow border border-violet-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={moodColors[entry.mood] || ""}
                  >
                    {entry.mood}
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/20 text-red-700 border-red-500/30">
                    Stress: {entry.stress}/10
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {entry.content}
              </p>
              <div className="bg-violet-50 border-l-4 border-violet-400 p-4 rounded">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-violet-900 mb-1">
                      AI Insights
                    </p>
                    <p className="text-sm text-violet-700">
                      {entry.ai_insights}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
