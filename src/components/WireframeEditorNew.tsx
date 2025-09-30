import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ColorPicker } from './ColorPicker';
import { FontLevelPicker } from './FontLevelPicker';
import { TextColorPicker } from './TextColorPicker';
import { TextAlignPicker } from './TextAlignPicker';
import { BorderWidthPicker } from './BorderWidthPicker';
import { BorderColorPicker } from './BorderColorPicker';
import { DimensionEditor } from './DimensionEditor';
import { GridSettings } from './GridSettings';
import { GridOverlay } from './GridOverlay';
import { IconLibrary } from './IconLibrary';
import { ElementTree } from './ElementTree';
import { useToast } from './ToastProvider';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import { ImageWithFallback } from './figma/ImageWithFallback';
import imageplaceholder from 'figma:asset/ecdfd66b885286c4c43bb92244a555fc7427404e.png';

const videoplaceholder = "https://images.unsplash.com/photo-1642726197561-ef7224c054a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHBsYXllciUyMHRodW1ibmFpbHxlbnwxfHx8fDE3NTc3NjA2Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

import { 
  Square, 
  Circle, 
  Minus,
  Home,
  Search,
  User,
  Heart,
  Mail,
  Phone,
  MapPin,
  Bell,
  Camera,
  Music,
  Settings,
  Shield,
  Lock,
  Eye,
  HelpCircle,
  Info,
  ShoppingCart,
  CreditCard,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  Calendar,
  Clock,
  Bookmark,
  Flag,
  Tag,
  File,
  Folder,
  LayoutGrid,
  List,
  Layout,
  Type,
  Image,
  Video,
  Star,
  MousePointer,
  Plus,
  ZoomIn,
  ZoomOut,
  Save,
  Layers,
  Palette,
  ChevronUp,
  ChevronDown,
  Trash2,
  Move3D,
  ArrowRight,
  Copy,
  Clipboard
} from 'lucide-react';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  backgroundColor?: string;
  textLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  zIndex?: number;
  borderWidth?: number;
  borderColor?: string;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
}

interface Wireframe {
  id: string;
  name: string;
  elements: WireframeElement[];
}

interface GridConfig {
  enabled: boolean;
  columns: number;
  gap: number;
  margin: number;
  color: 'red' | 'purple' | 'green';
  opacity: number;
}

interface Project {
  id: string;
  name: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  createdAt: string;
  gridConfig?: GridConfig;
}

interface WireframeEditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const getFontSize = (element: WireframeElement, resolution: 'mobile' | 'tablet' | 'desktop') => {
  const fontSizes = {
    desktop: {
      h1: 40,  // 2.5rem
      h2: 32,  // 2rem
      h3: 28,  // 1.75rem
      h4: 24,  // 1.5rem
      h5: 20,  // 1.25rem
      h6: 16,  // 1rem
      p: 16    // 1rem
    },
    tablet: {
      h1: 32,  // 2rem
      h2: 28,  // 1.75rem
      h3: 24,  // 1.5rem
      h4: 20,  // 1.25rem
      h5: 18,  // 1.125rem
      h6: 16,  // 1rem
      p: 15    // 0.95rem
    },
    mobile: {
      h1: 28,  // 1.75rem
      h2: 24,  // 1.5rem
      h3: 20,  // 1.25rem
      h4: 18,  // 1.125rem
      h5: 16,  // 1rem
      h6: 14,  // 0.875rem
      p: 14    // 0.875rem
    }
  };

  const level = element.textLevel || 'p';
  return fontSizes[resolution][level];
};

export function WireframeEditor({ project, onUpdateProject }: WireframeEditorProps) {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeWireframe, setActiveWireframe] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [sidebarTab, setSidebarTab] = useState<'components' | 'properties'>('components');
  const [gridConfig, setGridConfig] = useState<GridConfig>(
    project.gridConfig || {
      enabled: false,
      columns: 12,
      gap: 16,
      margin: 24,
      color: 'purple',
      opacity: 0.3
    }
  );
  const [draggedTool, setDraggedTool] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [isAddWireframeOpen, setIsAddWireframeOpen] = useState(false);
  const [newWireframeName, setNewWireframeName] = useState('');
  const [copiedElement, setCopiedElement] = useState<WireframeElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState('');
  const [originalElementState, setOriginalElementState] = useState<WireframeElement | null>(null);
  const [previewElement, setPreviewElement] = useState<WireframeElement | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Canvas dimensions based on resolution
  const getCanvasDimensions = () => {
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 667 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 1440, height: 900 };
    }
  };

  const currentWireframe = project.wireframes.find(w => w.id === activeWireframe);

  // Initialize with first wireframe if none exist
  React.useEffect(() => {
    if (project.wireframes.length === 0) {
      const firstWireframe: Wireframe = {
        id: Date.now().toString(),
        name: 'Tela 1',
        elements: []
      };
      
      const updatedProject = {
        ...project,
        wireframes: [firstWireframe]
      };
      
      onUpdateProject(updatedProject);
      setActiveWireframe(firstWireframe.id);
    }
  }, [project, onUpdateProject]);

  // Automatically switch to properties tab when an element is selected
  React.useEffect(() => {
    if (selectedElement) {
      setSidebarTab('properties');
    }
  }, [selectedElement]);

  const canvasDimensions = getCanvasDimensions();

  // Drag and drop functions
  const handleToolDragStart = (e: React.DragEvent, toolType: string) => {
    setDraggedTool(toolType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (draggedTool) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOverCanvas(true);
    }
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    
    if (!draggedTool) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    // Create element with minimum visible sizes
    const getMinimumSize = (type: string) => {
      switch (type) {
        case 'text': return { width: 100, height: 30 };
        case 'button': return { width: 80, height: 35 };
        case 'image': 
        case 'video': return { width: 120, height: 80 };
        case 'icon': return { width: 40, height: 40 };
        case 'line': return { width: 100, height: 2 };
        case 'circle': return { width: 60, height: 60 };
        default: return { width: 80, height: 60 };
      }
    };

    const minSize = getMinimumSize(draggedTool);
    
    const newElement: WireframeElement = {
      id: Date.now().toString(),
      type: draggedTool as any,
      x: Math.max(0, x - minSize.width / 2),
      y: Math.max(0, y - minSize.height / 2),
      width: minSize.width,
      height: minSize.height,
      text: draggedTool === 'text' ? 'Texto' : draggedTool === 'button' ? 'Button' : undefined,
      backgroundColor: draggedTool === 'text' ? 'transparent' : '#ffffff',
      textLevel: draggedTool === 'text' ? 'h3' : draggedTool === 'button' ? 'p' : undefined,
      textColor: 'var(--foreground)',
      textAlign: 'center',
      zIndex: 0,
      borderWidth: draggedTool === 'text' ? 0 : 2,
      borderColor: '#d1d5db',
      imageSrc: draggedTool === 'image' ? imageplaceholder : undefined,
      videoSrc: draggedTool === 'video' ? videoplaceholder : undefined,
      iconName: draggedTool === 'icon' ? 'Star' : undefined,
    };

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { ...w, elements: [...w.elements, newElement] }
          : w
      )
    };

    onUpdateProject(updatedProject);
    setDraggedTool(null);
    setSelectedElement(newElement.id);
    showToast('Elemento adicionado com sucesso!', 'success');
  };

  // Element management functions
  const updateElementProperty = (elementId: string, property: string, value: any) => {
    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { 
              ...w, 
              elements: w.elements.map(el => 
                el.id === elementId ? { ...el, [property]: value } : el
              ) 
            }
          : w
      )
    };
    onUpdateProject(updatedProject);
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { ...w, elements: w.elements.filter(e => e.id !== selectedElement) }
          : w
      )
    };

    onUpdateProject(updatedProject);
    setSelectedElement(null);
    showToast('Elemento excluído com sucesso!', 'success');
  };

  // Wireframe management
  const handleAddWireframe = () => {
    if (!newWireframeName.trim()) return;

    const newWireframe: Wireframe = {
      id: Date.now().toString(),
      name: newWireframeName.trim(),
      elements: []
    };

    const updatedProject = {
      ...project,
      wireframes: [...project.wireframes, newWireframe]
    };

    onUpdateProject(updatedProject);
    setActiveWireframe(newWireframe.id);
    setIsAddWireframeOpen(false);
    setNewWireframeName('');
    showToast('Nova tela criada com sucesso!', 'success');
  };

  const handleDeleteWireframe = (wireframeId: string) => {
    if (project.wireframes.length <= 1) {
      showToast('Não é possível excluir a última tela!', 'error');
      return;
    }

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.filter(w => w.id !== wireframeId)
    };

    // Switch to another wireframe if the active one is being deleted
    if (activeWireframe === wireframeId) {
      setActiveWireframe(updatedProject.wireframes[0]?.id || '');
    }

    onUpdateProject(updatedProject);
    showToast('Wireframe excluído com sucesso!', 'success');
  };

  // Grid configuration handler
  const handleGridConfigChange = (newConfig: GridConfig) => {
    setGridConfig(newConfig);
    const updatedProject = {
      ...project,
      gridConfig: newConfig
    };
    onUpdateProject(updatedProject);
  };

  // Canvas mouse handling
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'select') {
      setSelectedElement(null);
      return;
    }
  }, [selectedTool]);

  const handleCanvasMouseUp = useCallback(() => {
    // Canvas mouse up logic
  }, []);

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  const startResizing = (elementId: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Resize logic would go here
  };

  // Handler for tree operations
  const handleMoveElement = (elementId: string, newParentId: string | null) => {
    if (!currentWireframe) return;

    const updatedProject = {
      ...project,
      wireframes: project.wireframes.map(w => 
        w.id === activeWireframe 
          ? { 
              ...w, 
              elements: w.elements.map(el => 
                el.id === elementId ? { ...el, parentId: newParentId } : el
              ) 
            }
          : w
      )
    };
    onUpdateProject(updatedProject);
  };

  return (
    <div className="h-[calc(100vh-73px)]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Element Tree Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r border-border bg-card">
          <ElementTree
            elements={currentWireframe?.elements || []}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElementProperty}
            onDeleteElement={deleteSelectedElement}
            onMoveElement={handleMoveElement}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Canvas Panel */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="flex h-full flex-col">
            {/* Toolbar */}
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentWireframe?.name || 'Selecione uma tela'}
                </span>
                <Button size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-muted/30 p-8">
              <div className="flex justify-center">
                <div
                  ref={canvasRef}
                  className={`bg-white border-2 relative shadow-sm ${
                    isDragOverCanvas ? 'border-blue-500 border-dashed' : 'border-gray-300'
                  } ${
                    selectedTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
                  } ${
                    isDragging ? 'cursor-move' : isResizing ? 'cursor-crosshair' : ''
                  }`}
                  style={{
                    width: canvasDimensions.width * zoom,
                    height: canvasDimensions.height * zoom,
                    userSelect: 'none',
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseUp={handleCanvasMouseUp}
                  onDragOver={handleCanvasDragOver}
                  onDragLeave={handleCanvasDragLeave}
                  onDrop={handleCanvasDrop}
                >
                  {/* Grid Overlay */}
                  <GridOverlay
                    config={gridConfig}
                    canvasWidth={canvasDimensions.width}
                    canvasHeight={canvasDimensions.height}
                    zoom={zoom}
                  />

                  {/* Elements ordered by z-index */}
                  {currentWireframe?.elements
                    .slice()
                    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                    .map((element) => {
                    // Use preview element if it's being dragged/resized, otherwise use original
                    const displayElement = element;
                      
                    return (
                      <div 
                        key={element.id} 
                        className="absolute"
                        style={{ zIndex: displayElement.zIndex || 0 }}
                      >
                        {/* Main element */}
                        <div
                          className={`relative ${
                            displayElement.type === 'text' 
                              ? '' // No borders for text
                              : `border-2 ${
                                  selectedElement === element.id 
                                    ? 'border-blue-500' 
                                    : displayElement.borderWidth && displayElement.borderWidth > 0 
                                      ? 'border-transparent' 
                                      : 'border-transparent'
                                }`
                          } ${
                            selectedTool === 'select' && !isDragging && !isResizing 
                              ? 'cursor-move hover:shadow-md' 
                              : ''
                          }`}
                          style={{
                            left: displayElement.x * zoom,
                            top: displayElement.y * zoom,
                            width: displayElement.type === 'line' ? Math.abs(displayElement.width) * zoom : displayElement.width * zoom,
                            height: displayElement.type === 'line' ? displayElement.height * zoom : displayElement.height * zoom,
                            backgroundColor: displayElement.type === 'text' ? 'transparent' : (displayElement.backgroundColor || '#ffffff'),
                            borderRadius: displayElement.type === 'circle' ? '50%' : undefined,
                            borderWidth: displayElement.borderWidth && displayElement.borderWidth > 0 ? displayElement.borderWidth * zoom : undefined,
                            borderColor: displayElement.borderColor || '#d1d5db',
                            borderStyle: displayElement.borderWidth && displayElement.borderWidth > 0 ? 'solid' : undefined,
                            overflow: 'hidden',
                            transform: displayElement.type === 'line' ? 
                              `rotate(${Math.atan2(displayElement.height, displayElement.width) * 180 / Math.PI}deg)` : 
                              undefined,
                            transformOrigin: displayElement.type === 'line' ? 'left center' : undefined,
                          }}
                          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElement(element.id);
                          }}
                        >
                          {/* Text content */}
                          {element.text && (
                            <div 
                              className={`w-full h-full flex items-center justify-center font-medium ${
                                element.navigationTarget ? 'pointer-events-none' : ''
                              }`}
                              style={{ 
                                padding: element.type === 'text' ? `${4 * zoom}px` : `${2 * zoom}px`
                              }}
                            >
                              <div
                                className="break-words hyphens-auto w-full"
                                style={{ 
                                  fontSize: `${getFontSize(displayElement, project.resolution) * zoom}px`,
                                  color: element.textColor || '#374151',
                                  textAlign: element.textAlign || 'center',
                                  lineHeight: 1.2,
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {element.text}
                              </div>
                            </div>
                          )}
                          
                          {/* Image content */}
                          {element.type === 'image' && (
                            <ImageWithFallback
                              src={element.imageSrc || imageplaceholder}
                              alt="Imagem"
                              className="w-full h-full object-cover pointer-events-none"
                              style={{
                                borderRadius: element.type === 'circle' ? '50%' : undefined
                              }}
                            />
                          )}
                          
                          {/* Video content */}
                          {element.type === 'video' && (
                            <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
                              <ImageWithFallback
                                src={element.videoSrc || videoplaceholder}
                                alt="Vídeo"
                                className="w-full h-full object-cover pointer-events-none"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-4 border-t-2 border-b-2 border-l-white border-t-transparent border-b-transparent ml-1"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Icon content */}
                          {element.type === 'icon' && element.iconName && (
                            <div className="w-full h-full flex items-center justify-center">
                              {(() => {
                                const iconMap: { [key: string]: React.ComponentType<any> } = {
                                  'Home': Home, 'Search': Search, 'User': User, 'Heart': Heart, 'Star': Star,
                                  'Mail': Mail, 'Phone': Phone, 'MapPin': MapPin, 'Bell': Bell,
                                  'Camera': Camera, 'Image': Image, 'Video': Video, 'Music': Music,
                                  'Settings': Settings, 'Shield': Shield, 'Lock': Lock, 'Eye': Eye,
                                  'HelpCircle': HelpCircle, 'Info': Info, 'ShoppingCart': ShoppingCart,
                                  'CreditCard': CreditCard, 'DollarSign': DollarSign, 'TrendingUp': TrendingUp,
                                  'BarChart': BarChart3, 'Activity': Activity, 'Calendar': Calendar,
                                  'Clock': Clock, 'Bookmark': Bookmark, 'Flag': Flag, 'Tag': Tag,
                                  'File': File, 'Folder': Folder, 'Grid': LayoutGrid, 'List': List, 'Layout': Layout,
                                };
                                const IconComponent = iconMap[element.iconName] || Star;
                                return (
                                  <IconComponent 
                                    className="pointer-events-none text-gray-700"
                                    size={Math.min(element.width, element.height) * zoom * 0.6}
                                  />
                                );
                              })()}
                            </div>
                          )}

                        </div>

                        {/* Navigation Indicator */}
                        {element.navigationTarget && (
                          <div
                            className="absolute bg-blue-600 text-white text-xs px-1 py-0.5 rounded pointer-events-none flex items-center gap-1"
                            style={{
                              right: -5 * zoom,
                              top: -5 * zoom,
                              fontSize: Math.max(8, 10 * zoom),
                            }}
                          >
                            <ArrowRight size={Math.max(10, 12 * zoom)} />
                            <span className="hidden sm:inline">
                              {project.wireframes.find(w => w.id === element.navigationTarget)?.name}
                            </span>
                          </div>
                        )}

                        {/* Resize handles - only show for selected element and when using select tool */}
                        {selectedElement === element.id && selectedTool === 'select' && element.type !== 'line' && (
                          <>
                            {/* Corner handles */}
                            <div
                              className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize"
                              style={{
                                left: displayElement.x * zoom - 4,
                                top: displayElement.y * zoom - 4,
                              }}
                              onMouseDown={(e) => startResizing(element.id, 'nw', e)}
                            />
                            <div
                              className="absolute w-2 h-2 bg-blue-500 border border-white cursor-ne-resize"
                              style={{
                                left: (displayElement.x + displayElement.width) * zoom - 4,
                                top: displayElement.y * zoom - 4,
                              }}
                              onMouseDown={(e) => startResizing(element.id, 'ne', e)}
                            />
                            <div
                              className="absolute w-2 h-2 bg-blue-500 border border-white cursor-sw-resize"
                              style={{
                                left: displayElement.x * zoom - 4,
                                top: (displayElement.y + displayElement.height) * zoom - 4,
                              }}
                              onMouseDown={(e) => startResizing(element.id, 'sw', e)}
                            />
                            <div
                              className="absolute w-2 h-2 bg-blue-500 border border-white cursor-se-resize"
                              style={{
                                left: (displayElement.x + displayElement.width) * zoom - 4,
                                top: (displayElement.y + displayElement.height) * zoom - 4,
                              }}
                              onMouseDown={(e) => startResizing(element.id, 'se', e)}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Sidebar Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-l border-border bg-card">
          <div className="p-4 space-y-4 h-full overflow-auto">
            {/* Project Info */}
            <div>
              <h3 className="mb-2">Projeto: {project.name}</h3>
              <p className="text-sm text-muted-foreground">
                Resolução: {canvasDimensions.width}×{canvasDimensions.height}
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as 'components' | 'properties')} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Componentes
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Propriedades
                </TabsTrigger>
              </TabsList>

              {/* Components Tab */}
              <TabsContent value="components" className="space-y-6 mt-4">
                {/* Tools */}
                <div>
                  <Label className="text-sm">Ferramentas</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: 'select', icon: MousePointer, label: 'Selecionar', draggable: false },
                      { id: 'rectangle', icon: Square, label: 'Retângulo', draggable: true },
                      { id: 'circle', icon: Circle, label: 'Círculo', draggable: true },
                      { id: 'button', icon: Square, label: 'Botão', draggable: true },
                      { id: 'text', icon: Type, label: 'Texto', draggable: true },
                      { id: 'line', icon: Minus, label: 'Linha', draggable: true },
                      { id: 'image', icon: Image, label: 'Imagem', draggable: true },
                      { id: 'video', icon: Video, label: 'Vídeo', draggable: true },
                      { id: 'icon', icon: Star, label: 'Ícone', draggable: true },
                    ].map((tool) => (
                      <Button
                        key={tool.id}
                        variant={selectedTool === tool.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool(tool.id as any)}
                        className="aspect-square p-0 cursor-pointer"
                        title={`${tool.label}${tool.draggable ? ' - Arraste para o canvas' : ''}`}
                        draggable={tool.draggable}
                        onDragStart={(e) => tool.draggable ? handleToolDragStart(e, tool.id) : undefined}
                      >
                        <tool.icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Wireframes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Telas</Label>
                    <Dialog open={isAddWireframeOpen} onOpenChange={setIsAddWireframeOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Tela</DialogTitle>
                          <DialogDescription>
                            Adicione uma nova tela ao seu wireframe
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="wireframe-name">Nome da tela</Label>
                            <Input
                              id="wireframe-name"
                              value={newWireframeName}
                              onChange={(e) => setNewWireframeName(e.target.value)}
                              placeholder="Ex: Tela de Login"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddWireframeOpen(false);
                                setNewWireframeName('');
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleAddWireframe}>
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2">
                    {project.wireframes.map((wireframe) => (
                      <div
                        key={wireframe.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                          activeWireframe === wireframe.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setActiveWireframe(wireframe.id)}
                      >
                        <Square className="w-4 h-4" />
                        <span className="flex-1 text-sm">{wireframe.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWireframe(wireframe.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid Settings */}
                <GridSettings 
                  config={gridConfig}
                  onChange={handleGridConfigChange}
                />
              </TabsContent>

              {/* Properties Tab */}
              <TabsContent value="properties" className="space-y-4 mt-4">
                {selectedElement && currentWireframe ? (
                  (() => {
                    const element = currentWireframe.elements.find(e => e.id === selectedElement);
                      
                    if (!element) return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Move3D className="w-8 h-8 mx-auto mb-2" />
                        <p>Selecione um elemento para editar suas propriedades</p>
                      </div>
                    );
                    
                    return (
                      <div className="space-y-4">
                        {/* Element Info */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm">
                            <strong>Elemento selecionado:</strong> {element.type}
                          </div>
                          {element.text && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Texto: "{element.text}"
                            </div>
                          )}
                        </div>

                        {/* Text editing for text/button elements */}
                        {(element.type === 'text' || element.type === 'button') && (
                          <div>
                            <Label className="text-sm">Texto</Label>
                            <Input
                              value={element.text || ''}
                              onChange={(e) => updateElementProperty(element.id, 'text', e.target.value)}
                              placeholder="Digite o texto..."
                              className="mt-1"
                            />
                          </div>
                        )}

                        {/* Font Level Picker for text elements */}
                        {(element.type === 'text' || element.type === 'button') && (
                          <FontLevelPicker
                            value={element.textLevel || 'p'}
                            resolution={project.resolution}
                            onChange={(level) => updateElementProperty(element.id, 'textLevel', level)}
                          />
                        )}

                        {/* Text Color Picker for text elements */}
                        {(element.type === 'text' || element.type === 'button') && (
                          <TextColorPicker
                            value={element.textColor || 'var(--foreground)'}
                            onChange={(color) => updateElementProperty(element.id, 'textColor', color)}
                          />
                        )}

                        {/* Text Alignment for text elements */}
                        {(element.type === 'text' || element.type === 'button') && (
                          <TextAlignPicker
                            value={element.textAlign || 'center'}
                            onChange={(align) => updateElementProperty(element.id, 'textAlign', align)}
                          />
                        )}

                        {/* Dimensions and Position Editor */}
                        <DimensionEditor
                          element={{
                            x: element.x,
                            y: element.y,
                            width: element.width,
                            height: element.height
                          }}
                          onChange={(property, value) => updateElementProperty(element.id, property, value)}
                        />

                        {/* Color Picker - not for text elements */}
                        {element.type !== 'text' && (
                          <ColorPicker
                            value={element.backgroundColor || '#ffffff'}
                            onChange={(color) => updateElementProperty(element.id, 'backgroundColor', color)}
                          />
                        )}

                        {/* Icon Library for icon elements */}
                        {element.type === 'icon' && (
                          <IconLibrary
                            value={element.iconName || ''}
                            onChange={(iconName) => updateElementProperty(element.id, 'iconName', iconName)}
                          />
                        )}

                        {/* Navigation Target */}
                        <div>
                          <Label className="text-sm">Navegação</Label>
                          <Select 
                            value={element.navigationTarget || 'none'} 
                            onValueChange={(value) => {
                              if (value === 'none') {
                                updateElementProperty(element.id, 'navigationTarget', undefined);
                              } else {
                                updateElementProperty(element.id, 'navigationTarget', value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhuma navegação" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma navegação</SelectItem>
                              {project.wireframes
                                .filter(w => w.id !== activeWireframe)
                                .map((wireframe) => (
                                  <SelectItem key={wireframe.id} value={wireframe.id}>
                                    {wireframe.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {element.navigationTarget && (
                            <div className="text-xs text-muted-foreground flex items-center">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Navega para: {project.wireframes.find(w => w.id === element.navigationTarget)?.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Move3D className="w-8 h-8 mx-auto mb-2" />
                    <p>Selecione um elemento para editar suas propriedades</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}