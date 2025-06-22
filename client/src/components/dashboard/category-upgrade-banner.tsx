import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Sparkles } from "lucide-react";

interface CategoryUpgradeBannerProps {
  currentCategory: string;
  nextCategory: string;
  currentInvestment: number;
  requiredInvestment: number;
  onUpgrade?: () => void;
}

export default function CategoryUpgradeBanner({
  currentCategory,
  nextCategory,
  currentInvestment,
  requiredInvestment,
  onUpgrade
}: CategoryUpgradeBannerProps) {
  const progress = Math.min((currentInvestment / requiredInvestment) * 100, 100);
  const remaining = Math.max(requiredInvestment - currentInvestment, 0);

  const categoryColors = {
    bronze: "from-amber-400 to-yellow-500",
    silver: "from-gray-400 to-gray-500",
    gold: "from-yellow-400 to-yellow-600",
    platinum: "from-indigo-400 to-purple-500",
    diamond: "from-purple-400 to-pink-500",
    elite: "from-red-400 to-red-600",
  };

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <ArrowUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upgrade to {nextCategory.toUpperCase()}</h3>
              <p className="text-sm text-gray-600">Unlock higher commission rates and exclusive benefits</p>
            </div>
          </div>
          <Badge className={`bg-gradient-to-r ${categoryColors[nextCategory as keyof typeof categoryColors]} text-white`}>
            <Sparkles className="w-3 h-3 mr-1" />
            Next Level
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Investment Progress</span>
            <span>{progress.toFixed(1)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>₦{currentInvestment.toLocaleString()}</span>
            <span>₦{requiredInvestment.toLocaleString()}</span>
          </div>
        </div>

        {remaining > 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Invest <span className="font-semibold text-blue-600">₦{remaining.toLocaleString()}</span> more to upgrade
              </p>
            </div>
            <Button onClick={onUpgrade} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              Invest Now
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">
                Congratulations! You're eligible for upgrade
              </p>
            </div>
            <Button onClick={onUpgrade} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              Upgrade Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}