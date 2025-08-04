import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface TokenUsageData {
  tokenUsage: number
  loading: boolean
  error: string | null
}

export const useTokenUsage = () => {
  const { user } = useAuth()
  const [data, setData] = useState<TokenUsageData>({
    tokenUsage: 0,
    loading: true,
    error: null
  })

  const fetchTokenUsage = async () => {
    if (!user) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('token_usage')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setData({
        tokenUsage: profile?.token_usage || 0,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching token usage:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch token usage'
      }))
    }
  }

  useEffect(() => {
    if (user) {
      fetchTokenUsage()
    }
  }, [user])

  return {
    ...data,
    refreshTokenUsage: fetchTokenUsage
  }
}