import React, { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
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
  Eye,
  EyeOff
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

interface ElementTreeProps {
  elements: WireframeElement[];
  selectedElement: string | null;
  onSelectElement: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<WireframeElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onMoveElement: (elementId: string, newParentId: string | null) => void;
}

interface TreeNode {
  element: WireframeElement;
  children: TreeNode[];
}

const getElementIcon = (type: string) => {
  switch (type) {
    case 'rectangle': case 'button': return Square;
    case 'circle': return Circle;
    case 'text': return Type;
    case 'line': return Minus;
    case 'image': return Image;
    case 'video': return Video;
    case 'icon': return Star;
    default: return Square;
  }
};

const getElementName = (element: WireframeElement) => {
  if (element.name) return element.name;
  if (element.text) return element.text.substring(0, 20) + (element.text.length > 20 ? '...' : '');
  return `${element.type} ${element.id.substring(0, 8)}`;
};

export function ElementTree({ 
  elements, 
  selectedElement, 
  onSelectElement, 
  onUpdateElement, 
  onDeleteElement,
  onMoveElement 
}: ElementTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  // Build tree structure
  const buildTree = (): TreeNode[] => {
    const elementMap = new Map<string, WireframeElement>();
    elements.forEach(el => elementMap.set(el.id, el));

    const roots: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    // Create nodes for all elements
    elements.forEach(element => {
      nodeMap.set(element.id, { element, children: [] });
    });

    // Build parent-child relationships
    elements.forEach(element => {
      const node = nodeMap.get(element.id)!;
      if (element.parentId && nodeMap.has(element.parentId)) {
        const parent = nodeMap.get(element.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by zIndex
    const sortByZIndex = (nodes: TreeNode[]) => {
      return nodes.sort((a, b) => (a.element.zIndex || 0) - (b.element.zIndex || 0));
    };

    const sortRecursive = (nodes: TreeNode[]) => {
      const sorted = sortByZIndex(nodes);
      sorted.forEach(node => {
        node.children = sortRecursive(node.children);
      });
      return sorted;
    };

    return sortRecursive(roots);
  };

  const toggleExpanded = (elementId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedNodes(newExpanded);
  };

  const startEditing = (element: WireframeElement) => {
    setEditingName(element.id);
    setEditingValue(element.name || getElementName(element));
  };

  const saveEditing = () => {
    if (editingName) {
      onUpdateElement(editingName, { name: editingValue });
      setEditingName(null);
      setEditingValue('');
    }
  };

  const cancelEditing = () => {
    setEditingName(null);
    setEditingValue('');
  };

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetElementId: string | null) => {
    e.preventDefault();
    if (draggedElement && draggedElement !== targetElementId) {
      // Check if target is not a descendant of dragged element
      const isDescendant = (elementId: string, ancestorId: string): boolean => {
        const element = elements.find(el => el.id === elementId);
        if (!element || !element.parentId) return false;
        if (element.parentId === ancestorId) return true;
        return isDescendant(element.parentId, ancestorId);
      };

      if (!targetElementId || !isDescendant(targetElementId, draggedElement)) {
        onMoveElement(draggedElement, targetElementId);
      }
    }
    setDraggedElement(null);
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const { element } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(element.id);
    const isSelected = selectedElement === element.id;
    const isEditing = editingName === element.id;
    const IconComponent = getElementIcon(element.type);

    return (
      <div key={element.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-accent group ${
            isSelected ? 'bg-primary text-primary-foreground' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => !isEditing && onSelectElement(element.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, element.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, element.id)}
        >
          {/* Expand/Collapse button */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(element.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>

          {/* Element icon */}
          <IconComponent className="w-4 h-4 mx-2 flex-shrink-0" />

          {/* Element name */}
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

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(element);
              }}
              title="Renomear"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement(element.id);
              }}
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-medium text-sm">Elementos</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste para reorganizar a hierarquia
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className="p-2 min-h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          {tree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Square className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum elemento</p>
              <p className="text-xs">Adicione elementos ao wireframe</p>
            </div>
          ) : (
            tree.map(node => renderNode(node))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}