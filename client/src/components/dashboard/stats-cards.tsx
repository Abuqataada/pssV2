import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Users, Coins } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalInvestment: number;
    totalReturns: number;
    totalReferrals: number;
    totalCommissions: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Investment",
      value: `₦${stats?.totalInvestment?.toLocaleString() || '0'}`,
      icon: Wallet,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Returns",
      value: `₦${stats?.totalReturns?.toLocaleString() || '0'}`,
      icon: TrendingUp,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Total Referrals",
      value: stats?.totalReferrals?.toString() || '0',
      icon: Users,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Total Commissions",
      value: `₦${stats?.totalCommissions?.toLocaleString() || '0'}`,
      icon: Coins,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-600">{card.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
