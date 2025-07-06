
import { Moon, Sun, Dice6 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export const Header = () => {
  const { theme, setTheme } = useTheme()
  const { user, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Dice6 className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Bardly</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          
          {user ? (
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          ) : (
            <Button onClick={signInWithGoogle}>
              Sign In with Google
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
