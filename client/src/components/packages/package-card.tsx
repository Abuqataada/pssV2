import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PackageCardProps {
  category: string;
  name: string;
  commission: number;
  packages: number[];
  color: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export default function PackageCard({
  category,
  name,
  commission,
  packages,
  color,
  icon,
  onSelect,
}: PackageCardProps) {
  const isPopular = category === "gold";
  
  const colorClasses = {
    amber: "bg-amber-100 text-amber-600",
    gray: "bg-gray-100 text-gray-600", 
    yellow: "bg-yellow-100 text-yellow-600",
    indigo: "bg-indigo-100 text-indigo-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  const buttonClasses = {
    amber: "bg-amber-600 hover:bg-amber-700",
    gray: "bg-gray-600 hover:bg-gray-700",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    red: "bg-red-600 hover:bg-red-700",
  };

  return (
    <Card className={`relative hover:shadow-xl transition-shadow ${isPopular ? 'border-2 border-yellow-300' : 'border border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
            POPULAR
          </Badge>
        </div>
      )}
      
      <CardContent className="p-8">
        <div className="flex items-center mb-6">
          <div className={`w-12 h-12 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
            <p className={`${colorClasses[color as keyof typeof colorClasses]} font-semibold`}>
              {commission}% Commission
            </p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {packages.map((amount, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">₦{amount.toLocaleString()}</span>
              <span className="text-sm text-gray-600">
                {index === 0 ? "Entry Level" : index === packages.length - 1 ? "Premium" : "Standard"}
              </span>
            </div>
          ))}
        </div>
        
        <Button 
          className={`w-full ${buttonClasses[color as keyof typeof buttonClasses]} text-white py-3 px-6 font-semibold transition-colors`}
          onClick={onSelect}
        >
          Choose {name}
        </Button>
      </CardContent>
    </Card>
  );
}
