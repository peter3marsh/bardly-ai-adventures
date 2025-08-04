import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Zap, Shield, Heart } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface PaywallScreenProps {
  onClose: () => void
}

export const PaywallScreen = ({ onClose }: PaywallScreenProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Adventure Limit Reached</CardTitle>
          <CardDescription>
            You've used all 100,000 free tokens. Upgrade to Premium for unlimited adventures!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm">Unlimited adventure tokens</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm">Support continued development</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Opening checkout...' : 'Upgrade to Premium'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}