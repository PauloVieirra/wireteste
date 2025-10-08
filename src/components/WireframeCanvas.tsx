import React, { useRef, useEffect, Fragment, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Image as KonvaImage, Group, Path } from 'react-konva';
import Konva from 'konva';
import { iconIndex } from './icon-index'; // Import iconIndex
// @ts-ignore
import { iconPaths } from './icon-paths.js'; // Import generated icon paths
import { KonvaSvg } from './KonvaSvg';
import KonvaIconRenderer from './KonvaIconRenderer';

// --- DATA STRUCTURES (from WireframeEditor) ---
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
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  iconId?: string;
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
  opacity?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
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
  figmaFileKey?: string;
  figmaToken?: string;
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
const CanvasElement = ({ element, isSelected, onSelect, onUpdate, zoom, project, wireframe, getFontSize, getFontFamilyCSS, getElementMinimumSize, onElementDragEnd, onElementTransformEnd, canvasDimensions, draggable: draggableProp = true }) => {
  const shapeRef = useRef<Konva.Node>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  const [svgUrl, setSvgUrl] = useState<string | undefined>(undefined);

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
    if (element.type === 'icon' && element.iconId && project.figmaFileKey && project.figmaToken) {
      const fetchSvg = async () => {
        try {
          const response = await fetch(`https://api.figma.com/v1/images/${project.figmaFileKey}?ids=${element.iconId}&format=svg`, {
            headers: {
              'X-Figma-Token': project.figmaToken,
            },
          });
          const data = await response.json();
          if (data.images && data.images[element.iconId]) {
            setSvgUrl(data.images[element.iconId]);
          }
        } catch (error) {
          console.error('Error fetching SVG from Figma:', error);
        }
      };
      fetchSvg();
    }
  }, [element.type, element.iconId, project.figmaFileKey, project.figmaToken]);

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
    draggable: draggableProp,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onDragEnd: (e) => {
      e.cancelBubble = true;
      const absolutePos = e.target.getAbsolutePosition();
      onElementDragEnd(element.id, absolutePos.x, absolutePos.y);
    },
    dragBoundFunc: function (pos) {
        const node = shapeRef.current;
        if (!node) return pos;

        const parent = element.parentId ? wireframe.elements.find(el => el.id === element.parentId) : null;

        if (parent) {
            // Allow free movement for child elements during drag. Clamping is handled in onDragEnd.
            return pos;
        } else {
            // This is a top-level element. 'pos' is absolute.
            // Constrain it to the canvas boundaries.
            const minX = 0;
            const minY = 0;
            const maxX = canvasDimensions.width - node.width();
            const maxY = canvasDimensions.height - node.height();

            const newX = Math.max(minX, Math.min(pos.x, maxX));
            const newY = Math.max(minY, Math.min(pos.y, maxY));
            return { x: newX, y: newY };
        }
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
        const buttonFontSize = getFontSize(element, project.resolution);
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
                    fontFamily={element.fontFamily || 'Inter'}
                    fontWeight={element.fontWeight || 'normal'}
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
      const fontSize = getFontSize(element, project.resolution);
      const textProps = {
        ...commonProps,
        text: element.text || 'Text',
        fontSize: fontSize,
        fontFamily: element.fontFamily || 'Inter',
        fontWeight: element.fontWeight || 'normal',
        fill: element.textColor || 'var(--foreground)',
        align: element.textAlign || 'left',
        verticalAlign: "top",
        padding: 5,
        fontStyle: element.fontStyle || 'normal',
        textDecoration: element.textDecoration || 'none',
        wrap: "word",
      };

      if (element.textAutoResize === 'WIDTH_AND_HEIGHT') {
        delete textProps.width;
        delete textProps.height;
      } else if (element.textAutoResize === 'HEIGHT') {
        delete textProps.height;
      }

      component = (
        <Text
          key={element.id}
          ref={shapeRef}
          {...textProps}
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
      if (element.iconComponent || (element.iconId && svgUrl)) { // Figma icon or imported icon
        component = (
          <Group {...commonProps} ref={shapeRef}>
            <KonvaSvg
              src={element.iconComponent || svgUrl}
              width={element.width}
              height={element.height}
              fillColor={element.textColor || 'black'}
            />
          </Group>
        );
      } else if (element.iconName) { // Library icon
        component = (
          <Group {...commonProps} ref={shapeRef}>
            <KonvaIconRenderer
              iconName={element.iconName}
              width={element.width}
              height={element.height}
              fill={element.textColor || 'black'}
            />
          </Group>
        );
      } else { // Fallback
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
      }
      break;
    case 'frame':
      const hasBackground = element.backgroundColor && element.backgroundColor !== 'transparent';
      component = (
        <Group {...commonProps} ref={shapeRef}>
          <Rect
            width={element.width}
            height={element.height}
            fill={isSelected ? 'rgba(173, 216, 230, 0.3)' : element.backgroundColor || 'transparent'}
            stroke={isSelected ? 'lightblue' : '#e5e7eb'}
            strokeWidth={hasBackground ? 0 : 2}
            dash={hasBackground ? [] : [10, 5]}
            cornerRadius={[
              element.borderTopLeftRadius || 0,
              element.borderTopRightRadius || 0,
              element.borderBottomRightRadius || 0,
              element.borderBottomLeftRadius || 0,
            ]}
          />
        </Group>
      );
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
                    ignoreStroke={true}
                    centeredScaling={false}
                    boundBoxFunc={(oldBox, newBox) => {
                      const minSize = getElementMinimumSize(element.type);
                      if (Math.abs(newBox.width) < minSize || Math.abs(newBox.height) < minSize) {
                        return oldBox;
                      }
                      return newBox;
                    }}          onTransformEnd={(e) => {
            const node = shapeRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);

            const minSize = getElementMinimumSize(element.type);

            let newWidth = node.width() * scaleX;
            let newHeight = node.height() * scaleY;

            newWidth = (isNaN(newWidth) || !isFinite(newWidth)) ? minSize : Math.max(minSize, newWidth);
            newHeight = (isNaN(newHeight) || !isFinite(newHeight)) ? minSize : Math.max(minSize, newHeight);

            if (element.type === 'circle') {
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
    if (stage && stage.container()) {
      stage.container().style.cursor = 'default';
    }
  }, [ref]);

  const renderElement = (element: WireframeElement) => (
    <CanvasElement
      key={element.id}
      element={element}
      isSelected={element.id === selectedElementId}
      onSelect={onSelectElement}
      onUpdate={onUpdateElement}
      zoom={zoom}
      project={project}
      wireframe={wireframe}
      getFontSize={getFontSize}
      getFontFamilyCSS={getFontFamilyCSS}
      getElementMinimumSize={getElementMinimumSize}
      onElementDragEnd={onElementDragEnd}
      onElementTransformEnd={onElementTransformEnd}
      canvasDimensions={canvasDimensions}
    />
  );

  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', border: '1px solid #ccc', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <Stage
        ref={ref as React.RefObject<Konva.Stage>}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="bg-white"
        onMouseDown={onCanvasMouseDown}
      >
        <GridOverlay width={canvasDimensions.width} height={canvasDimensions.height} gridConfig={gridConfig} />
        <Layer>
          {wireframe.elements
            .filter(el => !el.parentId)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(element => {
              if (element.type === 'frame') {
                const children = wireframe.elements.filter(el => el.parentId === element.id);
                return (
                  <Group key={element.id} x={element.x} y={element.y} draggable onDragEnd={(e) => {
                    if (e.target === e.currentTarget) { // Only fire if the group itself was dragged
                      onElementDragEnd(element.id, e.currentTarget.x(), e.currentTarget.y());
                    }
                  }}
                  dragBoundFunc={(pos) => {
                    const newX = Math.max(0, Math.min(pos.x, canvasDimensions.width - element.width));
                    const newY = Math.max(0, Math.min(pos.y, canvasDimensions.height - element.height));
                    return { x: newX, y: newY };
                  }}
                  >
                    <CanvasElement
                      key={element.id}
                      element={{...element, x: 0, y: 0}}
                      isSelected={element.id === selectedElementId}
                      onSelect={onSelectElement}
                      onUpdate={onUpdateElement}
                      zoom={zoom}
                      project={project}
                      wireframe={wireframe}
                      getFontSize={getFontSize}
                      getFontFamilyCSS={getFontFamilyCSS}
                      getElementMinimumSize={getElementMinimumSize}
                      onElementDragEnd={onElementDragEnd}
                      onElementTransformEnd={onElementTransformEnd}
                      canvasDimensions={canvasDimensions}
                      draggable={false}
                    />
                    {children.map(child => renderElement(child))}
                  </Group>
                );
              }
              return renderElement(element);
            })}
        </Layer>
      </Stage>
    </div>
  );
});

WireframeCanvas.displayName = 'WireframeCanvas';
