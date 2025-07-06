
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { AdventureTile } from '@/components/AdventureTile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface PreseededAdventure {
  id: string
  title: string
  description: string
  image_url?: string
  starter_message: string
}

const Index = () => {
  const [newAdventureInput, setNewAdventureInput] = useState('')
  const [preseededAdventures, setPreseededAdventures] = useState<PreseededAdventure[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchPreseededAdventures()
  }, [])

  const fetchPreseededAdventures = async () => {
    try {
      console.log('Fetching preseeded adventures...')
      const { data, error } = await supabase
        .from('preseeded_adventures')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching preseeded adventures:', error)
        throw error
      }
      
      console.log('Preseeded adventures fetched:', data)
      setPreseededAdventures(data || [])
    } catch (error) {
      console.error('Error fetching preseeded adventures:', error)
      toast({
        title: "Error",
        description: "Failed to load adventure options.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createNewAdventure = async (title: string, starterMessage?: string) => {
    if (!user) {
      console.log('User not authenticated, redirecting to sign in')
      // Store the adventure details for after sign-in
      localStorage.setItem('pendingAdventure', JSON.stringify({ title, starterMessage }))
      await signInWithGoogle()
      return
    }

    try {
      const { data: adventure, error } = await supabase
        .from('adventures')
        .insert({
          user_id: user.id,
          title: title
        })
        .select()
        .single()

      if (error) throw error

      // If there's a starter message, add it as the first user message
      if (starterMessage) {
        await supabase
          .from('messages')
          .insert({
            adventure_id: adventure.id,
            content: starterMessage,
            sender: 'user'
          })
      }

      navigate(`/adventures/${adventure.id}`)
    } catch (error) {
      console.error('Error creating adventure:', error)
      toast({
        title: "Error",
        description: "Failed to create adventure.",
        variant: "destructive"
      })
    }
  }

  const handleNewAdventureSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newAdventureInput.trim()) {
      createNewAdventure(newAdventureInput.trim())
      setNewAdventureInput('')
    }
  }

  const handlePreseededAdventureClick = (adventure: PreseededAdventure) => {
    createNewAdventure(adventure.title, adventure.starter_message)
  }

  // Check for pending adventure after sign-in
  useEffect(() => {
    if (user) {
      const pendingAdventure = localStorage.getItem('pendingAdventure')
      if (pendingAdventure) {
        const { title, starterMessage } = JSON.parse(pendingAdventure)
        localStorage.removeItem('pendingAdventure')
        createNewAdventure(title, starterMessage)
      }
    }
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-12 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Bardly
          </h1>
          
          <form onSubmit={handleNewAdventureSubmit} className="max-w-2xl mx-auto mb-8">
            <div className="bg-muted rounded-3xl px-4 py-3 flex items-center space-x-3 shadow-sm border">
              <Input
                placeholder="Start a new adventure..."
                value={newAdventureInput}
                onChange={(e) => setNewAdventureInput(e.target.value)}
                className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button 
                type="submit" 
                size="icon"
                className="rounded-full w-8 h-8 p-0"
                disabled={!newAdventureInput.trim()}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {!loading && preseededAdventures.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Choose Your Adventure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {preseededAdventures.map((adventure) => (
                <AdventureTile
                  key={adventure.id}
                  title={adventure.title}
                  description={adventure.description}
                  imageUrl={adventure.image_url || undefined}
                  onClick={() => handlePreseededAdventureClick(adventure)}
                />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <p className="text-muted-foreground">Loading adventures...</p>
          </div>
        )}

        {!loading && preseededAdventures.length === 0 && (
          <div className="text-center">
            <p className="text-muted-foreground">No adventures available at the moment.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Index
