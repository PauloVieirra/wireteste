import React, { useState, useMemo, Suspense } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { iconIndex } from './icon-index'

const categoryKeywords: { [key: string]: string[] } = {
  navigation: ['arrow', 'chevron', 'house', 'door', 'sign', 'map', 'geo', 'compass'],
  social: ['person', 'people', 'user', 'heart', 'star', 'envelope', 'telephone', 'chat', 'share', 'bell', 'emoji'],
  media: ['camera', 'image', 'video', 'music', 'volume', 'play', 'pause', 'skip', 'stop', 'record', 'speaker', 'mic', 'film'],
  actions: ['plus', 'dash', 'x', 'check', 'pencil', 'trash', 'copy', 'save', 'download', 'upload', 'arrow-clockwise', 'funnel', 'filter', 'search'],
  system: ['gear', 'shield', 'lock', 'unlock', 'eye', 'power', 'wifi', 'battery', 'bug', 'terminal', 'code'],
  status: ['info', 'question', 'exclamation', 'check-circle', 'x-circle', 'toggle', 'lightbulb'],
  business: ['cart', 'credit-card', 'currency', 'graph', 'pie-chart', 'activity', 'briefcase', 'tag', 'receipt', 'shop'],
  organization: ['calendar', 'clock', 'bookmark', 'flag', 'paperclip', 'file', 'folder', 'list', 'grid', 'layout'],
  shapes: ['square', 'circle', 'triangle', 'hexagon', 'diamond', 'star'],
  brands: ['facebook', 'twitter', 'instagram', 'linkedin', 'github', 'google', 'microsoft', 'apple', 'whatsapp', 'youtube'],
}

const getCategorizedIcons = () => {
  const categorized: { [key: string]: { name: string; icon: React.LazyExoticComponent<React.ComponentType<any>> }[] } = {
    navigation: [], social: [], media: [], actions: [], system: [], status: [], business: [], organization: [], shapes: [], brands: [], other: [],
  }

  const iconNames = Object.keys(iconIndex)

  iconNames.forEach(iconName => {
    let category = 'other'
    for (const cat in categoryKeywords) {
      if (categoryKeywords[cat].some(keyword => iconName.includes(keyword))) {
        category = cat
        break
      }
    }
    const IconComponent = iconIndex[iconName]
    categorized[category].push({ name: iconName, icon: IconComponent })
  })

  return categorized
}

interface IconLibraryProps {
  onSelectIcon: (iconName: string, IconComponent: React.ComponentType<any>) => void
}

export function IconLibrary({ onSelectIcon }: IconLibraryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [iconsToShow, setIconsToShow] = useState(20) // Estado para controlar a quantidade de ícones a serem exibidos

  const iconLibrary = useMemo(() => getCategorizedIcons(), [])

  // Resetar iconsToShow quando a categoria ou termo de busca mudar
  React.useEffect(() => {
    setIconsToShow(20)
  }, [selectedCategory, searchTerm])

  const getFilteredIcons = () => {
    let allIcons: Array<{ name: string; icon: React.ComponentType<any>; category: string }> = []

    Object.entries(iconLibrary).forEach(([category, icons]) => {
      icons.forEach(icon => {
        allIcons.push({ ...icon, category })
      })
    })

    if (selectedCategory !== 'all') {
      allIcons = allIcons.filter(icon => icon.category === selectedCategory)
    }

    if (searchTerm) {
      allIcons = allIcons.filter(icon =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    const totalFilteredIcons = allIcons.length
    const iconsToDisplay = allIcons.slice(0, iconsToShow)

    return { iconsToDisplay, totalFilteredIcons }
  }

  const handleLoadMore = () => {
    setIconsToShow(prev => prev + 10)
  }

  const handleSelectIcon = (iconName: string, IconComponent: React.ComponentType<any>) => {
    onSelectIcon(iconName, IconComponent)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedCategory('all')
  }

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'navigation', name: 'Navegação' },
    { id: 'social', name: 'Social' },
    { id: 'media', name: 'Mídia' },
    { id: 'actions', name: 'Ações' },
    { id: 'system', name: 'Sistema' },
    { id: 'status', name: 'Status' },
    { id: 'business', name: 'Negócios' },
    { id: 'organization', name: 'Organização' },
    { id: 'shapes', name: 'Formas' },
    { id: 'brands', name: 'Marcas' },
    { id: 'other', name: 'Outros' },
  ]

  const { iconsToDisplay, totalFilteredIcons } = getFilteredIcons()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center p-2 border rounded-md"
        >
          Biblioteca de Ícones
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Biblioteca de Ícones</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="icon-search">Buscar ícone</Label>
            <Input
              id="icon-search"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="grid grid-cols-8 gap-2 p-2">
              {iconsToDisplay.map((iconData, index) => {
                const IconComponent = iconData.icon
                return (
                  <Button
                    key={`${iconData.category}-${iconData.name}-${index}`}
                    variant="outline"
                    size="sm"
                    className="h-16 w-16 p-0 flex flex-col items-center justify-center text-center"
                    onClick={() => handleSelectIcon(iconData.name, IconComponent)}
                    title={iconData.name}
                  >
                    <Suspense fallback={<div className="w-5 h-5" />}>
                      {IconComponent ? <IconComponent className="w-5 h-5" /> : <span>?</span>}
                    </Suspense>
                    <span className="text-xs mt-1 truncate w-full px-1">{iconData.name}</span>
                  </Button>
                )
              })}
            </div>

            {totalFilteredIcons > iconsToDisplay.length && (
              <div className="flex justify-center mt-4">
                <Button onClick={handleLoadMore} variant="outline">
                  Ver Mais
                </Button>
              </div>
            )}

            {totalFilteredIcons === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ícone encontrado
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
