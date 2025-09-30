import React, { useRef, useEffect, Fragment, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Image as KonvaImage, Group, Path } from 'react-konva';
import Konva from 'konva';
import { iconIndex } from './icon-index'; // Import iconIndex
import { iconPaths } from './icon-paths.js'; // Import generated icon paths

// --- DATA STRUCTURES (from WireframeEditor) ---
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
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
  opacity?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: 'inter' | 'roboto' | 'arial' | 'helvetica' | 'times' | 'georgia' | 'monospace';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
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
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  createdAt: string;
  gridConfig?: GridConfig;
}

// --- COMPONENT PROPS ---
interface WireframeCanvasProps {
  project: Project;
  wireframe: Wireframe;
  zoom: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, props: Partial<WireframeElement>) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
  canvasDimensions: { width: number; height: number };
  gridConfig: GridConfig;
  getFontSize: (element: WireframeElement, resolution: 'mobile' | 'tablet' | 'desktop') => number;
  getFontFamilyCSS: (font: string) => string;
  getElementMinimumSize: (elementType: string) => number;
  onCanvasMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementTransformEnd: (id: string, x: number, y: number, width: number, height: number) => void;
}

// --- SINGLE ELEMENT COMPONENT ---
const CanvasElement = ({ element, isSelected, onSelect, onUpdate, zoom, projectResolution, getFontSize, getFontFamilyCSS, getElementMinimumSize, onElementDragEnd, onElementTransformEnd, canvasDimensions }) => {
  const shapeRef = useRef<Konva.Node>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (element.type === 'image' && element.imageSrc) {
      const img = new window.Image();
      img.src = element.imageSrc;
      img.onload = () => {
        setImage(img);
      };
    } else {
      setImage(undefined);
    }
  }, [element.type, element.imageSrc]);

  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, shapeRef.current, trRef.current]);

  const commonProps = {
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    draggable: true,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onDragEnd: (e) => {
      const node = e.target;
      const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
      
      const newX = Math.max(0, Math.min(node.x(), canvasWidth - node.width()));
      const newY = Math.max(0, Math.min(node.y(), canvasHeight - node.height()));

      node.position({ x: newX, y: newY });
      onElementDragEnd(element.id, newX, newY);
    },
  };

  let component;
  switch (element.type) {
    case 'rectangle':
      component = (
        <Rect
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          fill={element.backgroundColor || '#ffffff'}
          stroke={element.borderColor || '#d1d5db'}
          strokeWidth={element.borderWidth || 0}
          cornerRadius={[
            element.borderTopLeftRadius || 0,
            element.borderTopRightRadius || 0,
            element.borderBottomRightRadius || 0,
            element.borderBottomLeftRadius || 0,
          ]}
        />
      );
      break;
    case 'button':
        const buttonFontSize = getFontSize(element, projectResolution);
        const buttonFontFamily = getFontFamilyCSS(element.fontFamily || 'inter');
        component = (
            <Group {...commonProps} ref={shapeRef}>
                <Rect
                    width={element.width}
                    height={element.height}
                    fill={element.backgroundColor || '#ffffff'}
                    stroke={element.borderColor || '#d1d5db'}
                    strokeWidth={element.borderWidth || 0}
                    cornerRadius={[
                        element.borderTopLeftRadius || 0,
                        element.borderTopRightRadius || 0,
                        element.borderBottomRightRadius || 0,
                        element.borderBottomLeftRadius || 0,
                    ]}
                />
                <Text
                    text={element.text || 'Button'}
                    fontSize={buttonFontSize}
                    fontFamily={buttonFontFamily}
                    fill={element.textColor || 'var(--foreground)'}
                    width={element.width}
                    height={element.height}
                    align={element.textAlign || 'center'}
                    verticalAlign="middle"
                    padding={5}
                    fontStyle={element.fontStyle || 'normal'}
                    textDecoration={element.textDecoration || 'none'}
                    wrap="word"
                />
            </Group>
        );
        break;
    case 'circle':
      component = (
        <Circle
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          radius={element.width / 2}
          fill={element.backgroundColor || '#ffffff'}
          stroke={element.borderColor || '#d1d5db'}
          strokeWidth={element.borderWidth || 0}
        />
      );
      break;
    case 'text':
      const fontSize = getFontSize(element, projectResolution);
      const fontFamily = getFontFamilyCSS(element.fontFamily || 'inter');
      component = (
        <Text
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          text={element.text || 'Text'}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fill={element.textColor || 'var(--foreground)'}
          align={element.textAlign || 'left'}
          verticalAlign="top"
          padding={5}
          fontStyle={element.fontStyle || 'normal'}
          textDecoration={element.textDecoration || 'none'}
          wrap="word"
          height={element.height} // Set height to allow vertical resizing
        />
      );
      break;
    case 'line':
      component = (
        <Rect
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          fill={element.textColor || 'black'}
          height={element.height || 2}
        />
      );
      break;
    case 'image':
      component = (
        <KonvaImage
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          image={image}
          opacity={element.opacity || 1}
        />
      );
      break;
    case 'video':
      component = (
        <Rect
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          fill="#000000"
          stroke={element.borderColor || '#d1d5db'}
          strokeWidth={element.borderWidth || 0}
        />
      );
      break;
    case 'icon':
      const paths = iconPaths[element.iconName || 'Star'];
      if (!paths || paths.length === 0) {
        console.warn(`Icon paths for ${element.iconName} not found.`);
        component = (
          <Text
            key={element.id}
            {...commonProps}
            ref={shapeRef}
            text="?"
            fontSize={element.width * 0.8}
            fill={element.textColor || 'black'}
            align="center"
            verticalAlign="middle"
          />
        );
      } else {
        component = (
          <Group {...commonProps} ref={shapeRef}>
            {paths.map((pathData, idx) => (
              <Path
                key={idx}
                data={pathData}
                fill={element.textColor || 'black'}
                scaleX={element.width / 16} // Scale from 16x16 viewBox
                scaleY={element.height / 16} // Scale from 16x16 viewBox
              />
            ))}
          </Group>
        );
      }
      break;
    default:
      component = (
        <Rect
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          fill={element.backgroundColor || '#E0E0E0'}
          stroke={element.borderColor || '#212121'}
          strokeWidth={element.borderWidth ?? 1}
        />
      );
      break;
  }

  return (
    <Fragment>
      {component}
      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio={element.type === 'circle'}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
          boundBoxFunc={(oldBox, newBox) => {
            const minSize = getElementMinimumSize(element.type);
            const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

            const box = { ...newBox };

            if (box.x < 0) {
              box.width += box.x;
              box.x = 0;
            }
            if (box.y < 0) {
              box.height += box.y;
              box.y = 0;
            }
            if (box.x + box.width > canvasWidth) {
              box.width = canvasWidth - box.x;
            }
            if (box.y + box.height > canvasHeight) {
              box.height = canvasHeight - box.y;
            }
            
            if (box.width < minSize || box.height < minSize) {
                return oldBox;
            }

            return box;
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);

            let newWidth = Math.max(getElementMinimumSize(element.type), node.width() * scaleX);
            let newHeight = Math.max(getElementMinimumSize(element.type), node.height() * scaleY);

            if (element.type === 'text') {
              const textNode = node as Konva.Text;
              const tempNode = textNode.clone({ listening: false });
              tempNode.height(undefined);
              tempNode.width(newWidth);
              const autoHeight = tempNode.height();
              newHeight = Math.max(newHeight, autoHeight);
            } else if (element.type === 'circle') {
              newWidth = newHeight = Math.max(newWidth, newHeight);
            }
            
            onElementTransformEnd(
              element.id,
              node.x(),
              node.y(),
              newWidth,
              newHeight
            );
          }}
        />
      )}
    </Fragment>
  );
};

// --- GRID OVERLAY COMPONENT ---
const GridOverlay = ({ width, height, gridConfig }) => {
  if (!gridConfig.enabled) return null;

  const lines = [];
  const margin = gridConfig.margin;
  const gap = gridConfig.gap;
  const columns = gridConfig.columns;

  // Calculate content area dimensions
  const contentWidth = width - 2 * margin;
  const contentHeight = height - 2 * margin;

  // Ensure columns are at least 1 to avoid division by zero
  const effectiveColumns = Math.max(1, columns);

  // Calculate column width
  const columnWidth = (contentWidth - (effectiveColumns - 1) * gap) / effectiveColumns;

  // Vertical lines (columns)
  for (let i = 0; i <= effectiveColumns; i++) {
    const x = margin + i * (columnWidth + gap);
    lines.push(
      <Rect
        key={`v-line-${i}`}
        x={x}
        y={margin}
        width={1}
        height={contentHeight}
        fill={gridConfig.color}
        opacity={gridConfig.opacity}
      />
    );
  }

  // Horizontal lines (rows)
  const horizontalLineSpacing = 50;
  const startY = margin;
  const endY = height - margin;

  for (let y = startY; y <= endY; y += horizontalLineSpacing) {
    lines.push(
      <Rect
        key={`h-line-${y}`}
        x={margin}
        y={y}
        width={contentWidth}
        height={1}
        fill={gridConfig.color}
        opacity={gridConfig.opacity}
      />
    );
  }

  return <Layer>{lines}</Layer>;
};


// --- MAIN CANVAS COMPONENT ---
export const WireframeCanvas = React.forwardRef(({
  project,
  wireframe,
  zoom,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onElementDragEnd,
  onElementTransformEnd,
  canvasDimensions = { width: 0, height: 0 },
  gridConfig = { enabled: false, columns: 12, gap: 20, margin: 20, color: 'red', opacity: 0.5 },
  getFontSize = () => 16,
  getFontFamilyCSS = () => 'inter',
  getElementMinimumSize = () => 10,
  onCanvasMouseDown,
}, ref) => {

  useEffect(() => {
    const stage = (ref as React.MutableRefObject<Konva.Stage>)?.current;
    if (stage) {
      stage.container().style.cursor = 'default';
    }
  }, [ref]);

  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', border: '1px solid #ccc', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <Stage
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="bg-white"
        onMouseDown={onCanvasMouseDown}
        ref={ref}
      >
        <GridOverlay width={canvasDimensions.width} height={canvasDimensions.height} gridConfig={gridConfig} />
        <Layer>
          {wireframe.elements
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(element => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={element.id === selectedElementId}
              onSelect={onSelectElement}
              onUpdate={onUpdateElement}
              zoom={zoom}
              projectResolution={project.resolution}
              getFontSize={getFontSize}
              getFontFamilyCSS={getFontFamilyCSS}
              getElementMinimumSize={getElementMinimumSize}
              onElementDragEnd={onElementDragEnd}
              onElementTransformEnd={onElementTransformEnd}
              canvasDimensions={canvasDimensions}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

WireframeCanvas.displayName = 'WireframeCanvas';