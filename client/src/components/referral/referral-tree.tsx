import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronDown, ChevronRight, User, Crown } from "lucide-react";

interface ReferralNode {
  id: number;
  name: string;
  category: string;
  referralCode: string;
  joinDate: string;
  children: ReferralNode[];
  stats: {
    directReferrals: number;
    totalDownline: number;
  };
}

interface ReferralTreeNodeProps {
  node: ReferralNode;
  depth: number;
  onNodeSelect: (node: ReferralNode) => void;
}

function ReferralTreeNode({ node, depth, onNodeSelect }: ReferralTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const categoryColors = {
    bronze: "bg-amber-100 text-amber-800",
    silver: "bg-gray-100 text-gray-800",
    gold: "bg-yellow-100 text-yellow-800",
    platinum: "bg-indigo-100 text-indigo-800",
    diamond: "bg-purple-100 text-purple-800",
    elite: "bg-red-100 text-red-800",
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
          depth > 0 ? "ml-8" : ""
        }`}
        onClick={() => onNodeSelect(node)}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        )}
        
        <div className="flex items-center flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{node.name}</span>
              <Badge variant="secondary" className={`text-xs ${categoryColors[node.category as keyof typeof categoryColors]}`}>
                {node.category.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Code: {node.referralCode} • Joined: {new Date(node.joinDate).toLocaleDateString()}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {node.stats.directReferrals} Direct
            </div>
            <div className="text-xs text-gray-500">
              {node.stats.totalDownline} Total
            </div>
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <ReferralTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReferralTree() {
  const [selectedNode, setSelectedNode] = useState<ReferralNode | null>(null);
  
  const { data: treeData, isLoading } = useQuery({
    queryKey: ["/api/referrals/tree"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Referral Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!treeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Referral Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No referral network data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Referral Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ReferralTreeNode
              node={treeData}
              depth={0}
              onNodeSelect={setSelectedNode}
            />
          </div>
        </CardContent>
      </Card>

      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Member Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedNode.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Category: <span className="font-medium capitalize">{selectedNode.category}</span></p>
                  <p>Referral Code: <span className="font-medium">{selectedNode.referralCode}</span></p>
                  <p>Join Date: <span className="font-medium">{new Date(selectedNode.joinDate).toLocaleDateString()}</span></p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Network Stats</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Direct Referrals: <span className="font-medium">{selectedNode.stats.directReferrals}</span></p>
                  <p>Total Downline: <span className="font-medium">{selectedNode.stats.totalDownline}</span></p>
                  <p>Network Depth: <span className="font-medium">{Math.max(0, getMaxDepth(selectedNode) - 1)} levels</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getMaxDepth(node: ReferralNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getMaxDepth));
}