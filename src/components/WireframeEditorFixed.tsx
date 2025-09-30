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
import { SimpleIconLibrary } from './SimpleIconLibrary';
import { LucideIconRenderer } from './LucideIconRenderer';
import { ElementTree } from './ElementTree';
import { useToast } from './ToastProvider';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';

const imageplaceholder = "https://images.unsplash.com/photo-1714578187196-29775454aa39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFjZWhvbGRlciUyMGltYWdlfGVufDF8fHx8MTc1NzgwOTUzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const videoplaceholder = "https://images.unsplash.com/photo-1642726197561-ef7224c054a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHBsYXllciUyMHRodW1ibmFpbHxlbnwxfHx8fDE3NTc3NjA2Nzl8MA&ixLib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

import { 
  Square, 
  Circle, 
  Minus,
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

export function WireframeEditorFixed({ project, onUpdateProject }: WireframeEditorProps) {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeWireframe, setActiveWireframe] = useState<string>('');
  const [zoom, setZoom] = useState(1);
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
  
  // Dragging and resizing states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialElementState, setInitialElementState] = useState<WireframeElement | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Canvas dimensions based on resolution
  const getCanvasDimensions = () => {
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 }; // iPhone X/11/12/13/14 standard
      case 'tablet': return { width: 768, height: 1024 }; // iPad standard
      case 'desktop': return { width: 1920, height: 1080 }; // Full HD standard
      default: return { width: 1920, height: 1080 };
    }
  };

  const currentWireframe = project.wireframes.find(w => w.id === activeWireframe);
  const canvasDimensions = getCanvasDimensions();

  // Element management functions
  const updateElementProperty = useCallback((elementId: string, property: string, value: any) => {
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
  }, [project, activeWireframe, onUpdateProject]);

  // Initialize with first wireframe if none exist
  useEffect(() => {
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
    } else if (!activeWireframe && project.wireframes.length > 0) {
      setActiveWireframe(project.wireframes[0].id);
    }
  }, [project, onUpdateProject, activeWireframe]);

  // Global mouse event handlers for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!canvasRef.current || !initialElementState) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const currentMouseX = (e.clientX - rect.left) / zoom;
      const currentMouseY = (e.clientY - rect.top) / zoom;
      
      if (isDragging && selectedElement) {
        const deltaX = currentMouseX - initialMousePos.x;
        const deltaY = currentMouseY - initialMousePos.y;
        
        let newX = initialElementState.x + deltaX;
        let newY = initialElementState.y + deltaY;
        
        // Constrain to canvas bounds
        newX = Math.max(0, Math.min(canvasDimensions.width - initialElementState.width, newX));
        newY = Math.max(0, Math.min(canvasDimensions.height - initialElementState.height, newY));
        
        // Update position in batch - use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          const updatedProject = {
            ...project,
            wireframes: project.wireframes.map(w => 
              w.id === activeWireframe 
                ? { 
                    ...w, 
                    elements: w.elements.map(el => 
                      el.id === selectedElement 
                        ? { ...el, x: newX, y: newY } 
                        : el
                    ) 
                  }
                : w
            )
          };
          onUpdateProject(updatedProject);
        });
      }
      
      if (isResizing && selectedElement) {
        const deltaX = currentMouseX - initialMousePos.x;
        const deltaY = currentMouseY - initialMousePos.y;
        
        let newX = initialElementState.x;
        let newY = initialElementState.y;
        let newWidth = initialElementState.width;
        let newHeight = initialElementState.height;
        
        const minSize = 5; // Minimum size for better flexibility
        
        switch (resizeHandle) {
          case 'nw':
            newWidth = Math.max(minSize, initialElementState.width - deltaX);
            newHeight = Math.max(minSize, initialElementState.height - deltaY);
            newX = initialElementState.x + (initialElementState.width - newWidth);
            newY = initialElementState.y + (initialElementState.height - newHeight);
            break;
          case 'ne':
            newWidth = Math.max(minSize, initialElementState.width + deltaX);
            newHeight = Math.max(minSize, initialElementState.height - deltaY);
            newY = initialElementState.y + (initialElementState.height - newHeight);
            break;
          case 'sw':
            newWidth = Math.max(minSize, initialElementState.width - deltaX);
            newHeight = Math.max(minSize, initialElementState.height + deltaY);
            newX = initialElementState.x + (initialElementState.width - newWidth);
            break;
          case 'se':
            newWidth = Math.max(minSize, initialElementState.width + deltaX);
            newHeight = Math.max(minSize, initialElementState.height + deltaY);
            break;
          case 'n':
            newHeight = Math.max(minSize, initialElementState.height - deltaY);
            newY = initialElementState.y + (initialElementState.height - newHeight);
            break;
          case 'e':
            newWidth = Math.max(minSize, initialElementState.width + deltaX);
            break;
          case 's':
            newHeight = Math.max(minSize, initialElementState.height + deltaY);
            break;
          case 'w':
            newWidth = Math.max(minSize, initialElementState.width - deltaX);
            newX = initialElementState.x + (initialElementState.width - newWidth);
            break;
        }
        
        // Constrain to canvas bounds with better logic
        if (newX < 0) {
          newWidth += newX;
          newX = 0;
        }
        if (newY < 0) {
          newHeight += newY;
          newY = 0;
        }
        
        // Ensure element doesn't exceed canvas bounds
        if (newX + newWidth > canvasDimensions.width) {
          newWidth = canvasDimensions.width - newX;
        }
        
        if (newY + newHeight > canvasDimensions.height) {
          newHeight = canvasDimensions.height - newY;
        }
        
        // Ensure minimum size is respected
        newWidth = Math.max(minSize, newWidth);
        newHeight = Math.max(minSize, newHeight);
        
        // Update all properties in batch to avoid conflicts - use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          const updatedProject = {
            ...project,
            wireframes: project.wireframes.map(w => 
              w.id === activeWireframe 
                ? { 
                    ...w, 
                    elements: w.elements.map(el => 
                      el.id === selectedElement 
                        ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight } 
                        : el
                    ) 
                  }
                : w
            )
          };
          onUpdateProject(updatedProject);
        });
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle('');
        setInitialElementState(null);
        
        // Reset cursor
        document.body.style.cursor = 'default';
      }
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, selectedElement, initialElementState, initialMousePos, resizeHandle, zoom, canvasDimensions, project, activeWireframe, onUpdateProject]);

  // Drag and drop functions
  const handleToolDragStart = (e: React.DragEvent, toolType: string) => {
    setDraggedTool(toolType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', toolType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    // Check if we have a dragged tool or an icon from library
    const hasIcon = e.dataTransfer.types.includes('application/json');
    
    if (draggedTool || hasIcon) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOverCanvas(true);
    }
  };

  const handleCanvasDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    // Check if it's an icon drop from icon library
    let iconData = null;
    try {
      const transferData = e.dataTransfer.getData('application/json');
      if (transferData) {
        iconData = JSON.parse(transferData);
      }
    } catch (error) {
      console.log('No JSON data found, checking for regular tool');
    }
    
    if (iconData && iconData.type === 'icon') {
      // Handle icon drop
      const minSize = { width: 40, height: 40 };
      
      const newElement: WireframeElement = {
        id: Date.now().toString(),
        type: 'icon',
        x: Math.max(0, Math.min(canvasDimensions.width - minSize.width, x - minSize.width / 2)),
        y: Math.max(0, Math.min(canvasDimensions.height - minSize.height, y - minSize.height / 2)),
        width: minSize.width,
        height: minSize.height,
        backgroundColor: 'transparent',
        textColor: 'var(--foreground)',
        zIndex: 0,
        borderWidth: 0,
        iconName: iconData.iconName,
        iconComponent: iconData.iconComponent,
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
      setSelectedElement(newElement.id);
      showToast(`Ícone ${iconData.iconName} adicionado com sucesso!`, 'success');
      return;
    }
    
    // Regular tool drop
    if (!draggedTool) {
      return;
    }
    
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
      x: Math.max(0, Math.min(canvasDimensions.width - minSize.width, x - minSize.width / 2)),
      y: Math.max(0, Math.min(canvasDimensions.height - minSize.height, y - minSize.height / 2)),
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

  // Element mouse handlers
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.detail === 2) { // Double click
      return;
    }

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    setInitialMousePos({ x: mouseX, y: mouseY });
    
    const element = currentWireframe?.elements.find(el => el.id === elementId);
    if (element) {
      setInitialElementState(element);
    }
  }, [currentWireframe, zoom]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    setInitialMousePos({ x: mouseX, y: mouseY });
    
    if (selectedElement) {
      const element = currentWireframe?.elements.find(el => el.id === selectedElement);
      if (element) {
        setInitialElementState(element);
      }
    }
  }, [selectedElement, currentWireframe, zoom]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.closest('[data-canvas-background]')) {
      setSelectedElement(null);
    }
  }, []);

  const selectedElementData = selectedElement && currentWireframe?.elements.find(el => el.id === selectedElement);

  // Render icon in canvas
  const renderIcon = (element: WireframeElement) => {
    if (element.iconName && element.iconComponent) {
      return (
        <LucideIconRenderer
          iconName={element.iconComponent}
          style={{
            fontSize: Math.min(element.width, element.height) * 0.6,
            color: element.textColor || 'var(--foreground)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      );
    }
    return <Star className="w-full h-full" style={{ color: element.textColor || 'var(--foreground)' }} />;
  };

  // Render element on canvas
  const renderElement = (element: WireframeElement) => {
    const isSelected = selectedElement === element.id;
    
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      backgroundColor: element.backgroundColor || 'transparent',
      border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || '#d1d5db'}` : 'none',
      borderRadius: element.type === 'circle' ? '50%' : '4px',
      cursor: 'move',
      zIndex: element.zIndex || 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.textAlign || 'center',
      fontSize: getFontSize(element, project.resolution),
      color: element.textColor || 'var(--foreground)',
      textAlign: element.textAlign || 'center',
      overflow: 'hidden',
      userSelect: 'none',
    };

    if (isSelected) {
      elementStyle.outline = '2px solid #3b82f6';
      elementStyle.outlineOffset = '-1px';
    }

    let content = null;
    
    switch (element.type) {
      case 'text':
      case 'button':
        content = element.text || (element.type === 'button' ? 'Button' : 'Text');
        break;
      case 'image':
        content = (
          <img 
            src={element.imageSrc || imageplaceholder} 
            alt="Placeholder" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        );
        break;
      case 'video':
        content = (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video className="w-8 h-8 text-white" />
          </div>
        );
        break;
      case 'icon':
        content = renderIcon(element);
        break;
      case 'line':
        elementStyle.backgroundColor = element.textColor || 'var(--foreground)';
        break;
      case 'rectangle':
      case 'circle':
      default:
        break;
    }

    return (
      <div
        key={element.id}
        style={elementStyle}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {content}
        
        {/* Resize handles */}
        {isSelected && (
          <>
            {/* Corner handles */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: -4,
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'nw-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'ne-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: -4,
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'sw-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'se-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            />
            
            {/* Edge handles */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'n-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 's-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: -4,
                transform: 'translateY(-50%)',
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'w-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: -4,
                transform: 'translateY(-50%)',
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                cursor: 'e-resize',
                zIndex: 1000
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />
          </>
        )}
      </div>
    );
  };

  if (!currentWireframe) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Wireframe Tabs */}
          <div className="flex items-center gap-2">
            {project.wireframes.map((wireframe) => (
              <Button
                key={wireframe.id}
                variant={activeWireframe === wireframe.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveWireframe(wireframe.id)}
                className="relative"
              >
                {wireframe.name}
                {project.wireframes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWireframe(wireframe.id);
                    }}
                    className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-sm p-0.5"
                  >
                    ×
                  </button>
                )}
              </Button>
            ))}
            
            <Dialog open={isAddWireframeOpen} onOpenChange={setIsAddWireframeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Tela</DialogTitle>
                  <DialogDescription>
                    Crie uma nova tela para seu wireframe
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
                    <Button variant="outline" onClick={() => setIsAddWireframeOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddWireframe}>
                      Criar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
            Resetar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Element Tree */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-r border-border bg-card p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Árvore de Componentes
                  </Label>
                  <div className="mt-2">
                    <ElementTree
                      elements={currentWireframe.elements}
                      selectedElement={selectedElement}
                      onSelectElement={setSelectedElement}
                      onUpdateElement={updateElementProperty}
                    />
                  </div>
                </div>

                {/* Tools Section */}
                <div>
                  <Label className="text-sm font-medium">Ferramentas</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onDragStart={(e) => handleToolDragStart(e, 'rectangle')}
                      draggable
                    >
                      <Square className="w-4 h-4" />
                      <span className="text-xs">Rect</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onDragStart={(e) => handleToolDragStart(e, 'circle')}
                      draggable
                    >
                      <Circle className="w-4 h-4" />
                      <span className="text-xs">Circle</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onDragStart={(e) => handleToolDragStart(e, 'text')}
                      draggable
                    >
                      <Type className="w-4 h-4" />
                      <span className="text-xs">Text</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onDragStart={(e) => handleToolDragStart(e, 'button')}
                      draggable
                    >
                      <MousePointer className="w-4 h-4" />
                      <span className="text-xs">Button</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onDragStart={(e) => handleToolDragStart(e, 'image')}
                      draggable
                    >
                      <Image className="w-4 h-4" />
                      <span className="text-xs">Image</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onDragStart={(e) => handleToolDragStart(e, 'video')}
                      draggable
                    >
                      <Video className="w-4 h-4" />
                      <span className="text-xs">Video</span>
                    </Button>
                  </div>
                </div>

                {/* Icons */}
                <div>
                  <Label className="text-sm font-medium">Ícones</Label>
                  <div className="mt-2">
                    <SimpleIconLibrary />
                  </div>
                </div>

                {/* Grid Settings */}
                <div>
                  <Label className="text-sm font-medium">Grid</Label>
                  <div className="mt-2">
                    <GridSettings
                      config={gridConfig}
                      onChange={handleGridConfigChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Canvas */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full bg-gray-50 overflow-auto">
              <div className="p-8 min-h-full flex items-center justify-center">
                <div
                  ref={canvasRef}
                  className={`relative bg-white shadow-lg ${isDragOverCanvas ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  style={{
                    width: canvasDimensions.width,
                    height: canvasDimensions.height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  onDragOver={handleCanvasDragOver}
                  onDragLeave={handleCanvasDragLeave}
                  onDrop={handleCanvasDrop}
                  onClick={handleCanvasClick}
                  data-canvas-background="true"
                >
                  {/* Grid Overlay */}
                  {gridConfig.enabled && (
                    <GridOverlay
                      config={gridConfig}
                      canvasDimensions={canvasDimensions}
                    />
                  )}

                  {/* Render Elements */}
                  {currentWireframe.elements
                    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                    .map(renderElement)}

                  {/* Canvas Info */}
                  <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                    {project.resolution} - {canvasDimensions.width}x{canvasDimensions.height}
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Properties */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-l border-border bg-card p-4 overflow-y-auto">
              {selectedElementData ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Propriedades
                    </Label>
                    <p className="text-sm text-muted-foreground capitalize mt-1">{selectedElementData.type}</p>
                  </div>

                  {/* Dimensions */}
                  <DimensionEditor
                    element={selectedElementData}
                    onUpdate={(property, value) => updateElementProperty(selectedElementData.id, property, value)}
                    canvasDimensions={canvasDimensions}
                    resolution={project.resolution}
                  />

                  {/* Text Properties */}
                  {(selectedElementData.type === 'text' || selectedElementData.type === 'button') && (
                    <>
                      <div>
                        <Label htmlFor="element-text">Texto</Label>
                        <Input
                          id="element-text"
                          value={selectedElementData.text || ''}
                          onChange={(e) => updateElementProperty(selectedElementData.id, 'text', e.target.value)}
                        />
                      </div>

                      <FontLevelPicker
                        value={selectedElementData.textLevel || 'p'}
                        onChange={(value) => updateElementProperty(selectedElementData.id, 'textLevel', value)}
                      />

                      <TextColorPicker
                        value={selectedElementData.textColor || 'var(--foreground)'}
                        onChange={(value) => updateElementProperty(selectedElementData.id, 'textColor', value)}
                      />

                      <TextAlignPicker
                        value={selectedElementData.textAlign || 'left'}
                        onChange={(value) => updateElementProperty(selectedElementData.id, 'textAlign', value)}
                      />
                    </>
                  )}

                  {/* Navigation Target for Buttons */}
                  {selectedElementData.type === 'button' && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Navegação
                      </Label>
                      <Select
                        value={selectedElementData.navigationTarget || ''}
                        onValueChange={(value) => updateElementProperty(selectedElementData.id, 'navigationTarget', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione a tela de destino" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma navegação</SelectItem>
                          {project.wireframes
                            .filter(w => w.id !== activeWireframe)
                            .map(wireframe => (
                              <SelectItem key={wireframe.id} value={wireframe.id}>
                                {wireframe.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Background Color */}
                  {selectedElementData.type !== 'text' && selectedElementData.type !== 'line' && (
                    <ColorPicker
                      label="Cor de Fundo"
                      value={selectedElementData.backgroundColor || '#ffffff'}
                      onChange={(value) => updateElementProperty(selectedElementData.id, 'backgroundColor', value)}
                    />
                  )}

                  {/* Border */}
                  {selectedElementData.type !== 'text' && selectedElementData.type !== 'line' && (
                    <>
                      <BorderWidthPicker
                        value={selectedElementData.borderWidth || 0}
                        onChange={(value) => updateElementProperty(selectedElementData.id, 'borderWidth', value)}
                      />

                      <BorderColorPicker
                        value={selectedElementData.borderColor || '#d1d5db'}
                        onChange={(value) => updateElementProperty(selectedElementData.id, 'borderColor', value)}
                      />
                    </>
                  )}

                  {/* Icon Selection */}
                  {selectedElementData.type === 'icon' && (
                    <div>
                      <Label className="text-sm font-medium">Escolher Ícone</Label>
                      <div className="mt-2">
                        <SimpleIconLibrary
                          onSelectIcon={(iconName) => {
                            updateElementProperty(selectedElementData.id, 'iconName', iconName);
                            updateElementProperty(selectedElementData.id, 'iconComponent', iconName);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Z-Index Controls */}
                  <div>
                    <Label className="text-sm font-medium">Camada</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateElementProperty(selectedElementData.id, 'zIndex', Math.max(0, (selectedElementData.zIndex || 0) - 1))}
                        title="Enviar para trás"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateElementProperty(selectedElementData.id, 'zIndex', (selectedElementData.zIndex || 0) + 1)}
                        title="Trazer para frente"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Delete Element */}
                  <div className="pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const updatedProject = {
                          ...project,
                          wireframes: project.wireframes.map(w => 
                            w.id === activeWireframe 
                              ? { ...w, elements: w.elements.filter(el => el.id !== selectedElementData.id) }
                              : w
                          )
                        };
                        onUpdateProject(updatedProject);
                        setSelectedElement(null);
                        showToast('Elemento excluído!', 'success');
                      }}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Elemento
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Selecione um elemento para editar suas propriedades</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// PONTO DE RESTAURAÇÃO CRIADO AQUI
// Versão: WireframeEditorFixed v1.0 - Layout Reorganizado
// Data: [Data atual]
// Funcionalidades restauradas:
// - Movimento livre em todas as direções (X e Y)
// - Redimensionamento completo em todos os handles (nw, ne, sw, se, n, s, e, w)
// - Seleção de elementos funcionando corretamente
// - Sistema de navegação para botões restaurado
// - Controle de z-index (camadas) com botões para enviar para trás/trazer para frente
// - Layout reorganizado: Árvore à esquerda, Canvas no centro, Propriedades à direita
// - Todas as funcionalidades de drag & drop mantidas
// - Sistema de grid configurável
// - Biblioteca de ícones funcionando
// - Controles de zoom
// - Múltiplas telas (wireframes)