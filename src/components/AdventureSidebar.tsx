
import { useState } from 'react'
import { Plus, Search, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Adventure {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface AdventureSidebarProps {
  adventures: Adventure[]
  currentAdventureId?: string
  onAdventureSelect: (id: string) => void
  onNewAdventure: () => void
  onRefreshAdventures: () => void
}

export const AdventureSidebar = ({ 
  adventures, 
  currentAdventureId, 
  onAdventureSelect, 
  onNewAdventure,
  onRefreshAdventures 
}: AdventureSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const { toast } = useToast()

  const filteredAdventures = adventures.filter(adventure =>
    adventure.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditStart = (adventure: Adventure) => {
    setEditingId(adventure.id)
    setEditTitle(adventure.title)
  }

  const handleEditSave = async (adventureId: string) => {
    try {
      const { error } = await supabase
        .from('adventures')
        .update({ title: editTitle })
        .eq('id', adventureId)

      if (error) throw error

      setEditingId(null)
      onRefreshAdventures()
      
      toast({
        title: "Adventure renamed",
        description: "Your adventure title has been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update adventure title.",
        variant: "destructive"
      })
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <div className="w-80 border-r bg-muted/50 flex flex-col h-full">
      <div className="p-4 space-y-4">
        <Button 
          onClick={onNewAdventure}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Adventure
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search Adventures
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search Adventures</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {filteredAdventures.map((adventure) => (
            <div
              key={adventure.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
                adventure.id === currentAdventureId
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
              onClick={() => adventure.id !== currentAdventureId && onAdventureSelect(adventure.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === adventure.id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(adventure.id)
                        if (e.key === 'Escape') handleEditCancel()
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSave(adventure.id)
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCancel()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="font-medium truncate">{adventure.title}</div>
                    <div className="text-xs opacity-70">
                      {new Date(adventure.updated_at).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
              
              {editingId !== adventure.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditStart(adventure)
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4">
        <Button variant="outline" className="w-full" disabled>
          Subscribe for more adventures
        </Button>
      </div>
    </div>
  )
}
