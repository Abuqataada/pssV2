import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReferralCardProps {
  stats?: {
    totalReferrals: number;
    activeReferrals: number;
    totalCommissions: number;
  };
}

export default function ReferralCard({ stats }: ReferralCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total Referrals</span>
            <span className="font-bold text-blue-600">{stats?.totalReferrals || 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Active Referrals</span>
            <span className="font-bold text-gray-900">{stats?.activeReferrals || 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Commissions Earned</span>
            <span className="font-bold text-green-600">₦{stats?.totalCommissions?.toLocaleString() || '0'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
