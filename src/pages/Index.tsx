
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { AdventureTile } from '@/components/AdventureTile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchPreseededAdventures()
  }, [])

  const fetchPreseededAdventures = async () => {
    try {
      const { data, error } = await supabase
        .from('preseeded_adventures')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPreseededAdventures(data || [])
    } catch (error) {
      console.error('Error fetching preseeded adventures:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewAdventure = async (title: string, starterMessage?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create adventures.",
        variant: "destructive"
      })
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Bardly
          </h1>
          
          <form onSubmit={handleNewAdventureSubmit} className="max-w-2xl mx-auto mb-8">
            <div className="flex space-x-2">
              <Input
                placeholder="Start a new adventure..."
                value={newAdventureInput}
                onChange={(e) => setNewAdventureInput(e.target.value)}
                className="text-lg py-6"
              />
              <Button type="submit" size="lg" disabled={!newAdventureInput.trim()}>
                Begin
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
      </main>
    </div>
  )
}

export default Index
