
import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Trash2, Edit2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  isOpen: boolean
  onToggle: () => void
}

export const AdventureSidebar = ({ 
  adventures, 
  currentAdventureId, 
  onAdventureSelect, 
  onNewAdventure,
  onRefreshAdventures,
  isOpen,
  onToggle
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

  const handleDelete = async (adventureId: string) => {
    try {
      const { error } = await supabase
        .from('adventures')
        .delete()
        .eq('id', adventureId)

      if (error) throw error

      onRefreshAdventures()
      
      toast({
        title: "Adventure deleted",
        description: "Your adventure has been deleted successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete adventure.",
        variant: "destructive"
      })
    }
  }

  if (!isOpen) {
    return (
      <div className="w-12 border-r bg-background flex flex-col h-full">
        <div className="p-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggle}
            className="w-8 h-8"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-end">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggle}
            className="w-6 h-6"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={onNewAdventure}
          variant="ghost"
          className="w-full justify-start h-9 px-3 text-sm hover:bg-muted/50 rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Adventure
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-9 px-3 text-sm hover:bg-muted/50 rounded-lg"
            >
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

      <div className="px-3 mb-2">
        <div className="text-xs font-medium text-muted-foreground">Adventures</div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {filteredAdventures.map((adventure) => (
            <div
              key={adventure.id}
              className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                adventure.id === currentAdventureId
                  ? 'bg-muted'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => adventure.id !== currentAdventureId && onAdventureSelect(adventure.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === adventure.id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(adventure.id)
                        if (e.key === 'Escape') handleEditCancel()
                      }}
                    />
                  </div>
                ) : (
                  <div className="font-medium truncate pr-8">{adventure.title}</div>
                )}
              </div>
              
              {editingId !== adventure.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditStart(adventure)}>
                      <Edit2 className="h-3 w-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(adventure.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

    </div>
  )
}
