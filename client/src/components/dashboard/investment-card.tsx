import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type InvestmentPackage } from "@shared/schema";

interface InvestmentCardProps {
  investment: InvestmentPackage;
}

export default function InvestmentCard({ investment }: InvestmentCardProps) {
  const startDate = new Date(investment.startDate);
  const maturityDate = new Date(investment.maturityDate);
  const now = new Date();
  
  const totalDuration = maturityDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.min((elapsed / totalDuration) * 100, 100);
  
  const monthsElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24 * 30));
  const totalMonths = investment.duration;

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900 capitalize">
              {investment.category} Package - ₦{Number(investment.amount).toLocaleString()}
            </h4>
            <p className="text-sm text-gray-600">
              Started: {startDate.toLocaleDateString()}
            </p>
          </div>
          <Badge variant={investment.isActive ? "default" : "secondary"}>
            {investment.isActive ? "Active" : "Completed"}
          </Badge>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{monthsElapsed}/{totalMonths} Months</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Monthly ROI</div>
            <div className="font-semibold">₦{Number(investment.monthlyRoi).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Earned</div>
            <div className="font-semibold text-green-600">₦{Number(investment.totalEarned).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-600">Maturity Date</div>
            <div className="font-semibold">{maturityDate.toLocaleDateString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
