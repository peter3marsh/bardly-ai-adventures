import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Crown, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Header } from '@/components/Header'

interface SubscriptionData {
  subscribed: boolean
  subscription_tier: string
  subscription_end: string | null
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const checkSubscription = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (error) throw error
      setSubscription(data)
    } catch (error) {
      console.error('Error checking subscription:', error)
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) return
    
    try {
      setActionLoading(true)
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (error) throw error
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return
    
    try {
      setActionLoading(true)
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (error) throw error
      
      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error opening customer portal:', error)
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkSubscription()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to access settings</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and subscription
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.user_metadata?.full_name || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking subscription status...
                </div>
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span>Current Plan:</span>
                    <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                      {subscription.subscription_tier === 'premium' ? 'Premium' : 'Free'}
                    </Badge>
                  </div>
                  
                  {subscription.subscribed && subscription.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on: {new Date(subscription.subscription_end).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-3">
                    {!subscription.subscribed ? (
                      <Button 
                        onClick={handleSubscribe}
                        disabled={actionLoading}
                        className="flex items-center gap-2"
                      >
                        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Crown className="h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={actionLoading}
                      >
                        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Manage Subscription
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      onClick={checkSubscription}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Refresh Status
                    </Button>
                  </div>

                  {!subscription.subscribed && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Premium Benefits:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Unlimited adventure tokens</li>
                        <li>• Priority support</li>
                        <li>• Advanced features</li>
                        <li>• No usage limits</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Failed to load subscription information</p>
                  <Button 
                    variant="outline" 
                    onClick={checkSubscription}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}