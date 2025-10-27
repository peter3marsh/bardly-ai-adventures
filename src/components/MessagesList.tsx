import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ChatMessage } from './ChatMessage'
import { Loader2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  created_at: string
  pending?: boolean
}

interface MessagesListProps {
  messages: Message[]
  isLoading: boolean
  messagesLoading: boolean
  adventureId?: string
}

export interface MessagesListHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

export const MessagesList = forwardRef<MessagesListHandle, MessagesListProps>(
  ({ messages, isLoading, messagesLoading, adventureId }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current
      if (!container) return

      if (behavior === 'smooth') {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        container.scrollTop = container.scrollHeight
      }
    }

    useImperativeHandle(ref, () => ({
      scrollToBottom
    }))

    useEffect(() => {
      scrollToBottom('smooth')
    }, [messages])

    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">
              <h3 className="text-lg font-medium mb-2">
                {adventureId ? "Start your adventure!" : "Ready to begin?"}
              </h3>
              <p>
                {adventureId
                  ? "Send a message to begin your D&D journey."
                  : "Send a message to create a new adventure and start your D&D journey."}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  isUser={message.sender === 'user'}
                  timestamp={message.created_at}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
)

MessagesList.displayName = 'MessagesList'
