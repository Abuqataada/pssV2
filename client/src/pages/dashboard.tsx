import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth, useLogout } from "@/hooks/use-auth";
import StatsCards from "@/components/dashboard/stats-cards";
import InvestmentCard from "@/components/dashboard/investment-card";
import ReferralCard from "@/components/dashboard/referral-card";
import PaystackButton from "@/components/payment/paystack-button";
import ReferralTree from "@/components/referral/referral-tree";
import UpgradeNotification from "@/components/notifications/upgrade-notification";
import CategoryUpgradeBanner from "@/components/dashboard/category-upgrade-banner";
import { useState } from "react";
import { LogOut, Plus, Download, ArrowUp, Copy, Network, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();
  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(true);

  const { data: investments = [] } = useQuery({
    queryKey: ["/api/investments"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: referralStats } = useQuery({
    queryKey: ["/api/referrals/stats"],
  });

  const copyReferralCode = async () => {
    if (user?.referralCode) {
      await navigator.clipboard.writeText(user.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                PSS
              </div>
              <div className="ml-4">
                <span className="text-lg font-semibold text-gray-900">{user.fullName}</span>
                <div className="text-sm text-gray-500 capitalize">{user.category} Member</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Balance</div>
                <div className="text-lg font-bold text-green-600">
                  ₦{stats?.totalReturns?.toLocaleString() || '0'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upgrade Notification */}
        {showUpgradeNotification && (
          <UpgradeNotification onDismiss={() => setShowUpgradeNotification(false)} />
        )}

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Referral Network
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Category Upgrade Banner */}
            <CategoryUpgradeBanner
              currentCategory={user.category}
              nextCategory={user.category === 'bronze' ? 'silver' : user.category === 'silver' ? 'gold' : 'platinum'}
              currentInvestment={stats?.totalInvestment || 0}
              requiredInvestment={user.category === 'bronze' ? 10000 : user.category === 'silver' ? 50000 : 200000}
              onUpgrade={() => setShowNewInvestment(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Investment Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Current Investments</CardTitle>
                    <Dialog open={showNewInvestment} onOpenChange={setShowNewInvestment}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          New Investment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <PaystackButton 
                          onSuccess={() => setShowNewInvestment(false)}
                          userId={user.id}
                          userEmail={user.email}
                        />
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {investments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No investments yet</p>
                          <p className="text-sm">Start your first investment to begin earning!</p>
                        </div>
                      ) : (
                        investments.map((investment: any) => (
                          <InvestmentCard key={investment.id} investment={investment} />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Referral Code */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {user.referralCode}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyReferralCode}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Stats */}
                <ReferralCard stats={referralStats} />

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Request Withdrawal
                      </Button>
                      <Button variant="outline" className="w-full" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                      <Button variant="outline" className="w-full" disabled>
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Upgrade Package
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="network">
            <ReferralTree />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Transaction history coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
