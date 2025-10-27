
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { AdventureSidebar } from '@/components/AdventureSidebar'
import { MessagesList, MessagesListHandle } from '@/components/MessagesList'
import { MessageInput } from '@/components/MessageInput'
import { PaywallScreen } from '@/components/PaywallScreen'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTokenUsage } from '@/hooks/useTokenUsage'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  created_at: string
  pending?: boolean
}

interface Adventure {
  id: string
  title: string
  created_at: string
  updated_at: string
}

const AdventureChat = () => {
  const { adventureId } = useParams<{ adventureId: string }>()
  const navigate = useNavigate()
  const { user, subscription, subscriptionLoading } = useAuth()
  const { tokenUsage, loading: tokenLoading } = useTokenUsage()
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [adventures, setAdventures] = useState<Adventure[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const messagesListRef = useRef<MessagesListHandle>(null)

  useEffect(() => {
    if (user) {
      fetchAdventures()
      if (adventureId) {
        fetchMessages()
      } else {
        setMessagesLoading(false)
      }
    }
  }, [user, adventureId])

  // Check for token limit on page load
  useEffect(() => {
    if (user && !subscriptionLoading && !tokenLoading) {
      const TOKEN_LIMIT = 100000
      const isSubscribed = subscription?.subscribed || false
      
      if (!isSubscribed && tokenUsage >= TOKEN_LIMIT) {
        setShowPaywall(true)
      }
    }
  }, [user, subscription, subscriptionLoading, tokenUsage, tokenLoading])

  const fetchAdventures = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('adventures')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setAdventures(data || [])
    } catch (error) {
      console.error('Error fetching adventures:', error)
    }
  }

  const fetchMessages = async () => {
    if (!adventureId) return

    setMessagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Type the messages properly by casting sender to the expected union type
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        sender: msg.sender as 'user' | 'ai'
      }))
      
      setMessages(typedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const createNewAdventure = async (title?: string) => {
    if (!user) return null

    try {
      const { data: adventure, error } = await supabase
        .from('adventures')
        .insert({
          user_id: user.id,
          title: title || 'New Adventure'
        })
        .select()
        .single()

      if (error) throw error
      
      fetchAdventures()
      return adventure
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new adventure.",
        variant: "destructive"
      })
      return null
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentInput.trim() || isLoading) return

    const messageContent = currentInput.trim()
    setCurrentInput('')
    setIsLoading(true)

    // Create optimistic user message with temporary ID
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: 'user',
      created_at: new Date().toISOString(),
      pending: true
    }

    // Add user message immediately for instant feedback
    setMessages(prev => [...prev, optimisticMessage])
    messagesListRef.current?.scrollToBottom('auto') // Instant scroll for user message

    try {
      let currentAdventureId = adventureId

      // If no adventure is selected, create a new one
      if (!currentAdventureId) {
        const newAdventure = await createNewAdventure()
        if (!newAdventure) {
          // Remove optimistic message on failure
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
          setIsLoading(false)
          return
        }
        currentAdventureId = newAdventure.id
        navigate(`/adventures/${currentAdventureId}`)
      }

      const response = await supabase.functions.invoke('chat', {
        body: {
          adventureId: currentAdventureId,
          message: messageContent
        }
      })

      if (response.error) {
        console.log('Response error structure:', response.error)
        
        // Check if it's a token limit error - handle both direct message and nested structure
        const errorMessage = response.error.message || response.error.error || response.error
        console.log('Error message:', errorMessage)
        
        if (errorMessage === 'LIMIT_EXCEEDED' || (response.error.message && response.error.message.includes('LIMIT_EXCEEDED'))) {
          setShowPaywall(true)
          // Remove optimistic message
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
          return
        }
        throw response.error
      }

      // Refresh messages to get real IDs and AI response
      await fetchMessages()
      
      // Update adventure timestamp
      await supabase
        .from('adventures')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentAdventureId)
        
      fetchAdventures()
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Sign in to continue</h2>
            <p className="text-muted-foreground">Please sign in to access your adventures.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <AdventureSidebar
          adventures={adventures}
          currentAdventureId={adventureId}
          onAdventureSelect={(id) => navigate(`/adventures/${id}`)}
          onNewAdventure={async () => {
            const newAdventure = await createNewAdventure()
            if (newAdventure) {
              navigate(`/adventures/${newAdventure.id}`)
            }
          }}
          onRefreshAdventures={fetchAdventures}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col relative">
          {showPaywall && <PaywallScreen />}
          
          <MessagesList
            ref={messagesListRef}
            messages={messages}
            isLoading={isLoading}
            messagesLoading={messagesLoading}
            adventureId={adventureId}
          />
          
          <MessageInput
            value={currentInput}
            onChange={setCurrentInput}
            onSubmit={sendMessage}
            isLoading={isLoading}
            adventureId={adventureId}
          />
        </div>
      </div>
    </div>
  )
}

export default AdventureChat
