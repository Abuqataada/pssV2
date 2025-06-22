import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import PackageCard from "@/components/packages/package-card";
import { INVESTMENT_CATEGORIES } from "@/lib/constants";
import { Crown, Medal, Award, Gem, Diamond, Star } from "lucide-react";

const categoryIcons = {
  bronze: Medal,
  silver: Award,
  gold: Crown,
  platinum: Gem,
  diamond: Diamond,
  elite: Star,
};

export default function Landing() {
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

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
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Private Salary System</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={activeModal === "login"} onOpenChange={(open) => setActiveModal(open ? "login" : null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-blue-600 hover:text-indigo-600">
                    Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <LoginForm onSuccess={() => setActiveModal(null)} />
                </DialogContent>
              </Dialog>
              
              <Dialog open={activeModal === "register"} onOpenChange={(open) => setActiveModal(open ? "register" : null)}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-indigo-700">
                    Get Started
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <RegisterForm onSuccess={() => setActiveModal(null)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Secure Your Financial Future with 
              <span className="text-yellow-300"> PSS</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Join thousands of investors earning consistent monthly returns through our referral-based investment platform. Start with as little as ₦500.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={() => setActiveModal("register")}
              >
                Start Investing Today
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
                onClick={() => setActiveModal("login")}
              >
                Login to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">15,847</div>
              <div className="text-gray-600">Active Investors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">₦2.8B</div>
              <div className="text-gray-600">Total Invested</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">₦1.2B</div>
              <div className="text-gray-600">Returns Paid</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">10%</div>
              <div className="text-gray-600">Monthly ROI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Packages */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Investment Packages</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our tiered investment categories, each designed to maximize your returns and referral earnings.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(INVESTMENT_CATEGORIES).map(([key, category]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              return (
                <PackageCard
                  key={key}
                  category={key}
                  name={category.name}
                  commission={category.commission}
                  packages={category.packages}
                  color={category.color}
                  icon={<Icon className="w-6 h-6" />}
                  onSelect={() => setActiveModal("register")}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  PSS
                </div>
                <span className="ml-3 text-xl font-bold">Private Salary System</span>
              </div>
              <p className="text-gray-400">Secure, scalable, and profitable investment platform with guaranteed returns.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Investment Plans</a></li>
                <li><a href="#" className="hover:text-white">Referral Program</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Support</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <p>📧 support@pss.com</p>
                <p>📞 +234 800 123 4567</p>
                <p>📍 Lagos, Nigeria</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Private Salary System (PSS). All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
