import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { initializePaystackPayment, generatePaymentReference } from "@/lib/paystack";
import { INVESTMENT_CATEGORIES, ROI_RATE } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface PaystackButtonProps {
  onSuccess: () => void;
  userId: number;
  userEmail: string;
}

export default function PaystackButton({ onSuccess, userId, userEmail }: PaystackButtonProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  const handlePayment = () => {
    if (!selectedCategory || !selectedPackage || !duration) {
      toast({
        title: "Incomplete Selection",
        description: "Please select category, package, and duration",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    const reference = generatePaymentReference(userId, selectedCategory);
    const monthlyRoi = selectedPackage * ROI_RATE;
    
    initializePaystackPayment({
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_your_public_key_here",
      email: userEmail,
      amount: selectedPackage * 100, // Convert to kobo
      currency: "NGN",
      reference,
      callback: async (response) => {
        try {
          // Create investment record
          await apiRequest("POST", "/api/investments", {
            category: selectedCategory,
            amount: selectedPackage.toString(),
            duration,
            monthlyRoi: monthlyRoi.toString(),
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          
          toast({
            title: "Investment Successful!",
            description: `Your ${selectedCategory} investment of ₦${selectedPackage.toLocaleString()} has been created.`,
          });
          
          onSuccess();
        } catch (error) {
          console.error("Investment creation failed:", error);
          toast({
            title: "Investment Creation Failed",
            description: "Payment successful but investment creation failed. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      onClose: () => {
        setIsProcessing(false);
      },
      metadata: {
        userId,
        investmentCategory: selectedCategory,
        packageAmount: selectedPackage,
        duration,
      },
    });
  };

  const selectedCategoryData = selectedCategory ? INVESTMENT_CATEGORIES[selectedCategory as keyof typeof INVESTMENT_CATEGORIES] : null;
  const monthlyRoi = selectedPackage * ROI_RATE;
  const totalReturn = monthlyRoi * duration;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>New Investment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Investment Category</Label>
          <Select onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INVESTMENT_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.name} ({category.commission}% Commission)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategoryData && (
          <div className="space-y-2">
            <Label>Package Amount</Label>
            <Select onValueChange={(value) => setSelectedPackage(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Package" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategoryData.packages.map((amount) => (
                  <SelectItem key={amount} value={amount.toString()}>
                    ₦{amount.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Investment Duration</Label>
          <Select onValueChange={(value) => setDuration(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Month</SelectItem>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedPackage > 0 && duration > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Investment Amount:</span>
              <span className="font-semibold">₦{selectedPackage.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly ROI (10%):</span>
              <span className="font-semibold">₦{monthlyRoi.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Returns:</span>
              <span className="font-semibold text-green-600">₦{totalReturn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Payout:</span>
              <span className="text-green-600">₦{(selectedPackage + totalReturn).toLocaleString()}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={!selectedCategory || !selectedPackage || !duration || isProcessing}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? "Processing..." : `Pay ₦${selectedPackage.toLocaleString()} with Paystack`}
        </Button>
      </CardContent>
    </Card>
  );
}
