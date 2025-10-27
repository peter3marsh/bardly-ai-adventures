import { Input } from './ui/input'
import { Button } from './ui/button'
import { ArrowUp, Loader2 } from 'lucide-react'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  adventureId?: string
}

export const MessageInput = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  adventureId
}: MessageInputProps) => {
  return (
    <div className="p-4 border-t">
      <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-center bg-muted rounded-3xl px-4 py-3">
          <Input
            placeholder={adventureId ? "What do you do next?" : "Start a new adventure..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          <Button
            type="submit"
            disabled={!value.trim() || isLoading}
            size="icon"
            className="ml-2 h-8 w-8 rounded-full shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
