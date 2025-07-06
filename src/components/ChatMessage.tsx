
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp: string
}

export const ChatMessage = ({ content, isUser, timestamp }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2 mb-4",
        isUser 
          ? "bg-primary text-primary-foreground ml-12" 
          : "bg-muted mr-12"
      )}>
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
        <div className={cn(
          "text-xs mt-1 opacity-70",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  )
}
