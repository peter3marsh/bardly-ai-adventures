
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdventureTileProps {
  title: string
  description: string
  imageUrl?: string
  onClick: () => void
}

export const AdventureTile = ({ title, description, imageUrl, onClick }: AdventureTileProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
      onClick={onClick}
    >
      {imageUrl && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
