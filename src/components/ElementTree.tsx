import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  Square, 
  Circle, 
  Type, 
  Image, 
  Video, 
  Minus, 
  Star,
  Trash2,
  Edit3,
  File,
  Folder,
  FolderOpen
} from 'lucide-react';

// Tabs component used elsewhere in the app; adjust path if different
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

// Copied from WireframeEditor.tsx - consider moving to a shared types file
interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon' | 'frame';
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

interface ElementTreeProps {
  wireframes: Wireframe[];
  activeWireframe: string;
  selectedElement: string | null;
  onSelectWireframe: (wireframeId: string) => void;
  onSelectElement: (elementId: string | null) => void;
  onUpdateWireframe: (wireframeId: string, updates: Partial<Wireframe>) => void;
  onUpdateElement: (elementId: string, property: string, value: any) => void;
  onDeleteWireframe: (wireframeId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onReparentElement: (elementId: string, newParentId: string | null, newX: number, newY: number) => void;
}

interface TreeNode {
  element: WireframeElement;
  children: TreeNode[];
}

const truncateName = (name: string, length: number) => {
  if (name.length > length) {
    return name.substring(0, length) + '...';
  }
  return name;
};

const getElementIcon = (type: string) => {
  switch (type) {
    case 'frame': return Folder;
    case 'rectangle': case 'button': return Square;
    case 'circle': return Circle;
    case 'text': return Type;
    case 'line': return Minus;
    case 'image': return Image;
    case 'video': return Video;
    case 'icon': return Star;
    default: return File;
  }
};

const getElementName = (element: WireframeElement) => {
  if (element.name && element.name.trim()) return truncateName(element.name, 40);
  if (element.text) return truncateName(element.text, 40);
  return `${element.type}`;
};

export function ElementTree({ 
  wireframes,
  activeWireframe,
  selectedElement, 
  onSelectWireframe,
  onSelectElement, 
  onUpdateWireframe,
  onUpdateElement, 
  onDeleteWireframe,
  onDeleteElement,
  onReparentElement
}: ElementTreeProps) {
  const [expandedWireframes, setExpandedWireframes] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [wireframeToDelete, setWireframeToDelete] = useState<string | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<'structure' | 'code'>('structure');
  const [jsonOpenWireframes, setJsonOpenWireframes] = useState<Record<string, boolean>>({});
  
  // DND State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (activeWireframe && !expandedWireframes.has(activeWireframe)) {
      toggleWireframe(activeWireframe, true);
    }
  }, [activeWireframe]);

  const handleDeleteWireframe = () => {
    if (wireframeToDelete) {
      onDeleteWireframe(wireframeToDelete);
      setWireframeToDelete(null);
    }
  };

  const toggleWireframe = (wireframeId: string, forceOpen = false) => {
    setExpandedWireframes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(wireframeId) && !forceOpen) {
        newExpanded.delete(wireframeId);
      } else {
        newExpanded.add(wireframeId);
      }
      return newExpanded;
    });
  };

  const toggleNode = (elementId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(elementId)) {
        newExpanded.delete(elementId);
      } else {
        newExpanded.add(elementId);
      }
      return newExpanded;
    });
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingValue(currentName);
  };

  const saveEditing = () => {
    if (editingId) {
      const isWireframe = wireframes.some(w => w.id === editingId);
      if (isWireframe) {
        onUpdateWireframe(editingId, { name: editingValue });
      } else {
        onUpdateElement(editingId, 'name', editingValue);
      }
      setEditingId(null);
      setEditingValue('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  // --- DND Handlers ---
  const handleDragStart = (e: React.DragEvent, element: WireframeElement) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    setDraggedItemId(element.id);
  };

  const handleDragOver = (e: React.DragEvent, targetElement?: WireframeElement) => {
    e.preventDefault();
    const draggedItem = getDraggedItem(e);
    if (!draggedItem) return;

    if (targetElement) {
      // Can't drop on itself or its own children
      if (draggedItem.id === targetElement.id || isDescendant(targetElement.id, draggedItem.id)) {
        setDropTargetId(null);
        return;
      }
      // Only frames can be drop targets
      if (targetElement.type === 'frame') {
        setDropTargetId(targetElement.id);
      } else {
        setDropTargetId(null);
      }
    } else {
      // Hovering over the root drop zone
      setDropTargetId('root');
    }
  };
  
  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, dropTarget?: WireframeElement) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedItem = getDraggedItem(e);
    if (!draggedItem) return;

    const currentElements = wireframes.find(w => w.id === activeWireframe)?.elements || [];
    const oldParent = currentElements.find(el => el.id === draggedItem.parentId);

    let newParentId: string | null = null;
    if (dropTarget && dropTarget.type === 'frame' && dropTarget.id !== draggedItem.id) {
      newParentId = dropTarget.id;
    }

    // If dropping on the same parent, do nothing
    if (draggedItem.parentId === newParentId) {
      cleanupDragState();
      return;
    }

    let newX = draggedItem.x;
    let newY = draggedItem.y;

    // Reparenting logic with coordinate conversion
    if (newParentId && !draggedItem.parentId) {
      // Moving from root into a frame
      const newParent = currentElements.find(el => el.id === newParentId);
      if (newParent) {
        newX = draggedItem.x - newParent.x;
        newY = draggedItem.y - newParent.y;
      }
    } else if (!newParentId && draggedItem.parentId) {
      // Moving from a frame to root
      if (oldParent) {
        newX = draggedItem.x + oldParent.x;
        newY = draggedItem.y + oldParent.y;
      }
    } else if (newParentId && draggedItem.parentId) {
      // Moving from one frame to another
      const newParent = currentElements.find(el => el.id === newParentId);
      if (oldParent && newParent) {
        newX = (draggedItem.x + oldParent.x) - newParent.x;
        newY = (draggedItem.y + oldParent.y) - newParent.y;
      }
    }
    
    onReparentElement(draggedItem.id, newParentId, newX, newY);
    cleanupDragState();
  };

  const cleanupDragState = () => {
    setDraggedItemId(null);
    setDropTargetId(null);
  };

  const getDraggedItem = (e: React.DragEvent): WireframeElement | null => {
    try {
      return JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return null;
    }
  };

  const isDescendant = (potentialChildId: string, parentId: string): boolean => {
      const currentElements = wireframes.find(w => w.id === activeWireframe)?.elements || [];
      let currentId: string | undefined = potentialChildId;
      while(currentId) {
          const el = currentElements.find(e => e.id === currentId);
          if (!el) return false;
          if (el.parentId === parentId) return true;
          currentId = el.parentId;
      }
      return false;
  }


  const buildTree = (elements: WireframeElement[]): TreeNode[] => {
    const elementMap = new Map<string, WireframeElement>();
    elements.forEach(el => elementMap.set(el.id, el));

    const roots: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    elements.forEach(element => {
      nodeMap.set(element.id, { element, children: [] });
    });

    elements.forEach(element => {
      const node = nodeMap.get(element.id)!;
      if (element.parentId && nodeMap.has(element.parentId)) {
        const parentNode = nodeMap.get(element.parentId);
        // Ensure parent is a frame before adding child
        if (parentNode && parentNode.element.type === 'frame') {
            parentNode.children.push(node);
        } else {
            roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortByZIndex = (nodes: TreeNode[]) => nodes.sort((a, b) => (a.element.zIndex || 0) - (b.element.zIndex || 0));
    const sortRecursive = (nodes: TreeNode[]) => {
      const sorted = sortByZIndex(nodes);
      sorted.forEach(node => { node.children = sortRecursive(node.children); });
      return sorted;
    };

    return sortRecursive(roots);
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const { element } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(element.id);
    const isSelected = selectedElement === element.id;
    const isEditing = editingId === element.id;
    const isDropTarget = dropTargetId === element.id;
    const isDragged = draggedItemId === element.id;
    const IconComponent = getElementIcon(element.type);

    return (
      <div key={element.id} className="select-none"
        onDragOver={(e) => handleDragOver(e, element)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, element)}
      >
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, element)}
          onDragEnd={cleanupDragState}
          className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-accent group ${
            isSelected ? 'bg-primary text-primary-foreground' : ''
          } ${isDropTarget ? 'bg-blue-200' : ''} ${isDragged ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (isEditing) return;
            console.log('ElementTree CLICK element:', element.id, 'type:', element.type);
            onSelectElement(element.id);
          }}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              <Button
                    variant="ghost" size="sm" className="w-4 h-4 p-0 hover:bg-transparent"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleNode(element.id); }}
                  >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            )}
          </div>

          <IconComponent className="w-3 h-3 mx-2 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing();
                  if (e.key === 'Escape') cancelEditing();
                }}
                onBlur={saveEditing}
                className="h-6 text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate" title={getElementName(element)}>
                {getElementName(element)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); startEditing(element.id, getElementName(element)); }}
              title="Renomear"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteElement(element.id); }}
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderWireframe = (wireframe: Wireframe) => {
    const isWireframeExpanded = expandedWireframes.has(wireframe.id);
    const isWireframeActive = activeWireframe === wireframe.id;
    const isEditing = editingId === wireframe.id;
    const elementTree = buildTree(wireframe.elements);
    const isRootDropTarget = dropTargetId === 'root';

    return (
      <div key={wireframe.id} className="select-none">
        <div
          className={`flex items-center py-1 pl-2 pr-1 rounded text-sm cursor-pointer hover:bg-accent group ${
            isWireframeActive ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => {
            if (isEditing) return;
            console.log('ElementTree CLICK wireframe:', wireframe.id, 'name:', wireframe.name);
            toggleWireframe(wireframe.id);
            onSelectWireframe(wireframe.id);
            onSelectElement(null);
          }}
        >
          <Button
            variant="ghost" size="sm" className="w-4 h-4 p-0 hover:bg-transparent"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleWireframe(wireframe.id); }}
          >
            {isWireframeExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          </Button>

          <div className="flex-1 min-w-0 ml-2">
            {isEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing();
                  if (e.key === 'Escape') cancelEditing();
                }}
                onBlur={saveEditing}
                className="h-6 text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate font-semibold" title={wireframe.name}>
                {truncateName(wireframe.name, 40)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); startEditing(wireframe.id, wireframe.name); }}
              title="Renomear Tela"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="sm" className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setWireframeToDelete(wireframe.id); }}
              title="Excluir Tela"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {isWireframeExpanded && (
          <div 
            ref={dropZoneRef}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)}
            className={`pl-4 border-l-2 border-dashed border-border ml-4 ${isRootDropTarget ? 'bg-blue-100' : ''}`}
          >
            {elementTree.length > 0 ? (
              elementTree.map(node => renderNode(node, 1))
            ) : (
              <div className="text-xs text-muted-foreground p-2 pl-5">Nenhum elemento nesta tela.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // JSON inspector view (shows nested nodes and preserves its own state)
  const JsonCodeView: React.FC<{
  wireframes: Wireframe[];
  activeWireframe: string;
  selectedElement: string | null;
  onSelectWireframe: (id: string) => void;
  onSelectElement: (id: string | null) => void;
}> = ({ wireframes, activeWireframe, selectedElement, onSelectWireframe, onSelectElement }) => {
  const toggle = (id: string) => setJsonOpenWireframes(prev => ({ ...prev, [id]: !prev[id] }));

    const buildTreeLocal = (elements: WireframeElement[]): TreeNode[] => {
      const nodeMap = new Map<string, TreeNode>();
      elements.forEach(el => nodeMap.set(el.id, { element: el, children: [] }));
      const roots: TreeNode[] = [];
      elements.forEach(el => {
        const node = nodeMap.get(el.id)!;
        if (el.parentId && nodeMap.has(el.parentId)) {
          const parent = nodeMap.get(el.parentId);
          if (parent && parent.element.type === 'frame') parent.children.push(node);
          else roots.push(node);
        } else roots.push(node);
      });
      const sortByZ = (nodes: TreeNode[]) => nodes.sort((a, b) => (a.element.zIndex || 0) - (b.element.zIndex || 0));
      const recurse = (nodes: TreeNode[]) => {
        const s = sortByZ(nodes);
        s.forEach(n => { n.children = recurse(n.children); });
        return s;
      };
      return recurse(roots);
    };

  const renderNode = (node: TreeNode, depth = 0, wireframeId?: string) => {
      const el = node.element;
      const isSelected = selectedElement === el.id;
      const json = {
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        name: el.name,
        text: el.text,
        parentId: el.parentId,
      };

      return (
        <div key={el.id} style={{ paddingLeft: depth * 12 }}>
          <div
            onClick={(e) => { e.stopPropagation(); console.log('JsonCodeView CLICK element:', el.id, 'in wireframe:', wireframeId); if (wireframeId) setJsonOpenWireframes(prev => ({ ...prev, [wireframeId]: true })); onSelectElement(el.id); }}
            className={`cursor-pointer my-2 p-2 rounded border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50 hover:border-border'}`}
          >
            <div className="text-xs text-muted-foreground mb-1">{el.type} — {el.id}</div>
            <pre className="whitespace-pre-wrap text-[12px] font-mono m-0 p-0">{JSON.stringify(json, null, 2)}</pre>
          </div>

          {node.children.length > 0 && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1, wireframeId))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="p-3 overflow-y-auto h-full">
        {wireframes.map(w => {
          const tree = buildTreeLocal(w.elements);
          return (
            <div key={w.id} className="mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => toggle(w.id)}
                  className="text-sm font-medium text-left w-full"
                >
                  {w.name} <span className="text-xs text-muted-foreground">({w.elements.length} itens)</span>
                </button>
              </div>

              {jsonOpenWireframes[w.id] && (
                <div className="mt-2 ml-2">
                  {tree.length === 0 && <div className="text-sm text-muted-foreground">Sem elementos</div>}
                  {tree.map(node => renderNode(node, 0, w.id))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="h-full flex flex-col">
        

        <div className="flex-1 overflow-hidden">
          <Tabs value={leftPanelTab} onValueChange={(v: string) => setLeftPanelTab(v as 'structure' | 'code')} className="h-full flex flex-col">
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="structure" className="flex-1">Estrutura</TabsTrigger>
              <TabsTrigger value="code" className="flex-1">Código</TabsTrigger>
            </TabsList>

            <TabsContent value="structure" className="h-full overflow-hidden">
              {wireframes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tela criada</p>
                  <p className="text-xs">Crie uma nova tela para começar</p>
                </div>
              ) : (
                <div className="overflow-y-auto h-full p-2">
                  {wireframes.map(renderWireframe)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="h-full overflow-hidden">
              <JsonCodeView wireframes={wireframes} activeWireframe={activeWireframe} selectedElement={selectedElement} onSelectWireframe={onSelectWireframe} onSelectElement={onSelectElement} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <AlertDialog open={!!wireframeToDelete} onOpenChange={() => setWireframeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a tela e todos os seus elementos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWireframe}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
