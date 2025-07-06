
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { AdventureSidebar } from '@/components/AdventureSidebar'
import { ChatMessage } from '@/components/ChatMessage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  created_at: string
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
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [adventures, setAdventures] = useState<Adventure[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchAdventures()
      if (adventureId) {
        fetchMessages()
      }
    }
  }, [user, adventureId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const createNewAdventure = async () => {
    if (!user) return

    try {
      const { data: adventure, error } = await supabase
        .from('adventures')
        .insert({
          user_id: user.id,
          title: 'New Adventure'
        })
        .select()
        .single()

      if (error) throw error
      
      navigate(`/adventures/${adventure.id}`)
      fetchAdventures()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new adventure.",
        variant: "destructive"
      })
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentInput.trim() || !adventureId || isLoading) return

    const messageContent = currentInput.trim()
    setCurrentInput('')
    setIsLoading(true)

    try {
      const response = await supabase.functions.invoke('chat', {
        body: {
          adventureId,
          message: messageContent
        }
      })

      if (response.error) throw response.error

      // Refresh messages to show the new conversation
      await fetchMessages()
      
      // Update adventure timestamp
      await supabase
        .from('adventures')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', adventureId)
        
      fetchAdventures()
    } catch (error) {
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <AdventureSidebar
          adventures={adventures}
          currentAdventureId={adventureId}
          onAdventureSelect={(id) => navigate(`/adventures/${id}`)}
          onNewAdventure={createNewAdventure}
          onRefreshAdventures={fetchAdventures}
        />
        
        <div className="flex-1 flex flex-col">
          {adventureId ? (
            <>
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-20">
                      <h3 className="text-lg font-medium mb-2">Start your adventure!</h3>
                      <p>Send a message to begin your D&D journey.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        content={message.content}
                        isUser={message.sender === 'user'}
                        timestamp={message.created_at}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="border-t p-4">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="What do you do next?"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!currentInput.trim() || isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Select an Adventure</h2>
                <p className="text-muted-foreground mb-6">
                  Choose an adventure from the sidebar or create a new one to get started.
                </p>
                <Button onClick={createNewAdventure}>
                  Create New Adventure
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdventureChat
