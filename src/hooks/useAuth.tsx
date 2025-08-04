import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface SubscriptionData {
  subscribed: boolean
  subscription_tier: string
  subscription_end: string | null
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const checkSubscription = async (currentUser?: User | null) => {
    const userToCheck = currentUser || user
    if (!userToCheck) return
    
    try {
      setSubscriptionLoading(true)
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (!error && data) {
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)
      
      // Check subscription for authenticated users
      if (currentUser) {
        checkSubscription(currentUser)
      }
    })

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        
        // Check subscription on auth state change
        if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          checkSubscription(currentUser)
        } else if (!currentUser) {
          setSubscription(null)
        }
      }
    )

    return () => authSubscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSubscription(null) // Clear subscription on sign out
  }

  const refreshSubscription = () => {
    if (user) {
      checkSubscription()
    }
  }

  return {
    user,
    loading,
    subscription,
    subscriptionLoading,
    signInWithGoogle,
    signOut,
    refreshSubscription,
  }
}