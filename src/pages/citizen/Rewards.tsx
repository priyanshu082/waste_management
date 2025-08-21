
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Award, Gift, Clock, ArrowUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RewardTier {
  name: string;
  pointsRequired: number;
  benefits: string[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
}

const Rewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userPoints = user?.points || 0;

  // Define reward tiers
  const rewardTiers: RewardTier[] = [
    {
      name: 'Bronze',
      pointsRequired: 0,
      benefits: ['Basic pickup scheduling', 'Educational materials access']
    },
    {
      name: 'Silver',
      pointsRequired: 100,
      benefits: ['Priority pickup scheduling', '5% discount on special waste disposal']
    },
    {
      name: 'Gold',
      pointsRequired: 300,
      benefits: ['VIP pickup scheduling', '15% discount on special waste disposal', 'Monthly environmental workshop access']
    },
    {
      name: 'Platinum',
      pointsRequired: 500,
      benefits: ['24/7 premium service', '25% discount on all services', 'Quarterly sustainability consultation']
    }
  ];

  // Find current tier
  const currentTier = rewardTiers
    .slice()
    .reverse()
    .find(tier => userPoints >= tier.pointsRequired) || rewardTiers[0];
  
  // Find next tier
  const nextTierIndex = rewardTiers.findIndex(tier => tier.name === currentTier.name) + 1;
  const nextTier = nextTierIndex < rewardTiers.length ? rewardTiers[nextTierIndex] : null;
  
  // Calculate progress to next tier
  const progressToNextTier = nextTier
    ? Math.min(100, Math.round(((userPoints - currentTier.pointsRequired) / (nextTier.pointsRequired - currentTier.pointsRequired)) * 100))
    : 100;

  // Fetch available rewards from backend
  const { data: availableRewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }
      const data = await response.json();
      return data.rewards as Reward[];
    }
  });

  // Fetch user's reward history
  const { data: rewardHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['rewardHistory'],
    queryFn: async () => {
      const response = await fetch('/api/rewards/history');
      if (!response.ok) {
        throw new Error('Failed to fetch reward history');
      }
      const data = await response.json();
      return data.history;
    }
  });

  const handleRedeemReward = async (reward: Reward) => {
    if (userPoints < reward.pointsCost) {
      toast({
        title: "Not enough points",
        description: `You need ${reward.pointsCost - userPoints} more points to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rewardId: reward.id })
      });

      if (!response.ok) {
        throw new Error('Failed to redeem reward');
      }

      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed ${reward.name}.`,
        variant: "default"
      });

      // Refresh user data (handled by AuthContext's refresh mechanism)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem reward",
        variant: "destructive"
      });
    }
  };

  if (isLoadingRewards || isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading rewards...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Eco Rewards Program</h1>
        <p className="text-muted-foreground">
          Earn points for responsible waste management
        </p>
      </div>
      
      {/* Points overview */}
      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{userPoints} Points</h2>
                <p className="text-muted-foreground">{currentTier.name} Tier Member</p>
              </div>
            </div>
            
            {nextTier && (
              <div className="w-full md:w-1/2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{currentTier.name}</span>
                  <span>{nextTier.name}</span>
                </div>
                <Progress value={progressToNextTier} className="h-2" />
                <p className="text-xs mt-1 text-right text-muted-foreground">
                  {nextTier.pointsRequired - userPoints} points to next tier
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Tier benefits */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Your Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {rewardTiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`${tier.name === currentTier.name ? 'border-primary' : ''}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  {tier.name === currentTier.name && <Sparkles className="h-4 w-4 text-yellow-500" />}
                  {tier.name} Tier
                </CardTitle>
                <CardDescription>{tier.pointsRequired} points required</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ArrowUp className="h-3 w-3 mt-1 rotate-45 text-green-500" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Available rewards */}
      {availableRewards && availableRewards.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableRewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    {reward.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{reward.pointsCost} points</span>
                    <Button 
                      size="sm"
                      disabled={userPoints < reward.pointsCost}
                      onClick={() => handleRedeemReward(reward)}
                    >
                      Redeem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Redemption History */}
      {rewardHistory && rewardHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Redemption History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {rewardHistory.map((item: any) => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.rewardName}</p>
                        <p className="text-sm text-muted-foreground">
                          Redeemed on {new Date(item.redeemedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      -{item.pointsCost} points
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Rewards;
