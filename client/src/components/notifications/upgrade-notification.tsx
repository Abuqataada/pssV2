import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UpgradeNotificationProps {
  onDismiss: () => void;
}

export default function UpgradeNotification({ onDismiss }: UpgradeNotificationProps) {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if user is eligible for upgrade based on some criteria
    // This is a simplified check - in real implementation, you'd check actual investment amounts
    const checkUpgradeEligibility = () => {
      if (!user) return false;
      
      // Simulate upgrade eligibility based on category and some conditions
      const eligibilityMap = {
        bronze: Math.random() > 0.7, // 30% chance
        silver: Math.random() > 0.8, // 20% chance
        gold: Math.random() > 0.9,   // 10% chance
        platinum: Math.random() > 0.95, // 5% chance
        diamond: Math.random() > 0.98,  // 2% chance
        elite: false // Already at highest level
      };

      return eligibilityMap[user.category as keyof typeof eligibilityMap] || false;
    };

    setShouldShow(checkUpgradeEligibility());
  }, [user]);

  if (!shouldShow || !user) return null;

  const getNextCategory = (current: string) => {
    const upgrades = {
      bronze: 'silver',
      silver: 'gold', 
      gold: 'platinum',
      platinum: 'diamond',
      diamond: 'elite'
    };
    return upgrades[current as keyof typeof upgrades];
  };

  const nextCategory = getNextCategory(user.category);
  if (!nextCategory) return null;

  return (
    <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">Category Upgrade Available!</h4>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Eligible
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Congratulations! Your investment performance qualifies you for an upgrade from{' '}
                <span className="font-medium capitalize">{user.category}</span> to{' '}
                <span className="font-medium capitalize text-yellow-600">{nextCategory}</span> category.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Learn More
                </Button>
                <Button size="sm" variant="outline" onClick={onDismiss}>
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}