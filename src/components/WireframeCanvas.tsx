import React, { useRef, useEffect, Fragment, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Image as KonvaImage, Group, Path } from 'react-konva';
import Konva from 'konva';
import { iconIndex } from './icon-index'; // Import iconIndex
// @ts-ignore
import { iconPaths } from './icon-paths.js'; // Import generated icon paths
import { KonvaSvg } from './KonvaSvg';
import KonvaIconRenderer from './KonvaIconRenderer';
import { FloatingToolbar } from './FloatingToolbar';

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
  child?: WireframeElement[];
  name?: string;
  opacity?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textBorderColor?: string;
  textBorderWidth?: number;
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
  pixelRatio?: number;
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
  isReadOnly?: boolean;
  isXRayMode?: boolean;
}

// --- SINGLE ELEMENT COMPONENT ---
const CanvasElement = ({ element, isSelected, onSelect, onUpdate, zoom, project, wireframe, getFontSize, getFontFamilyCSS, getElementMinimumSize, onElementDragEnd, onElementTransformEnd, canvasDimensions, draggable: draggableProp = true, isReadOnly = false, isXRayMode = false }) => {
  const shapeRef = useRef<Konva.Node>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  const [svgUrl, setSvgUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const src = element.type === 'image' ? element.imageSrc : element.type === 'video' ? element.videoSrc : null;
    if (src) {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        setImage(img);
      };
    } else {
      setImage(undefined);
    }
  }, [element.type, element.imageSrc, element.videoSrc]);

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

  const xrayProps = isXRayMode ? {
    fill: 'transparent',
    stroke: '#0000FF', // Blue
    strokeWidth: 1,
  } : {};

  const commonProps = {
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    draggable: !isReadOnly && draggableProp,
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.evt.preventDefault();
      onSelect(element.id);
    },
    onTap: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.evt.preventDefault();
      onSelect(element.id);
    },
    onDragEnd: (e) => {
      e.cancelBubble = true;
      const absolutePos = e.target.getAbsolutePosition();
      onElementDragEnd(element.id, absolutePos.x, absolutePos.y);
    },
    dragBoundFunc: function (pos) {
        const node = shapeRef.current;
        if (!node) return pos;

        // Since we don't have easy access to the parent here, we'll clamp to canvas for all.
        // The final position is determined in onDragEnd anyway.
        const minX = 0;
        const minY = 0;
        const maxX = canvasDimensions.width - node.width();
        const maxY = canvasDimensions.height - node.height();

        const newX = Math.max(minX, Math.min(pos.x, maxX));
        const newY = Math.max(minY, Math.min(pos.y, maxY));
        return { x: newX, y: newY };
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
          {...xrayProps}
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
                    {...xrayProps}
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
          {...xrayProps}
        />
      );
      break;
    case 'text':
      const fontSize = getFontSize(element, project.resolution);
      const textProps: any = {
        ...commonProps,
        text: element.text || 'Text',
        fontSize: fontSize,
        fontFamily: element.fontFamily || 'Inter',
        fontWeight: element.fontWeight || 'normal',
        fill: element.textColor || 'var(--foreground)',
        stroke: element.textBorderColor,
        strokeWidth: element.textBorderWidth,
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
          {...xrayProps}
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
          {...xrayProps}
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
          {...xrayProps}
        />
      );
      break;
    case 'video':
      if (element.videoSrc && element.videoSrc.startsWith('http')) {
        component = null; // Will be rendered as HTML video player
      } else {
        component = (
          <KonvaImage
            key={element.id}
            {...commonProps}
            ref={shapeRef}
            image={image}
            opacity={element.opacity || 1}
            {...xrayProps}
          />
        );
      }
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
              {...xrayProps}
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
              {...xrayProps}
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
            {...xrayProps}
          />
        );
      }
      break;
          case 'frame':
            component = (
              <Group {...commonProps} ref={shapeRef}>
                <Rect
                  width={element.width}
                  height={element.height}
                  fill={isSelected ? 'rgba(173, 216, 230, 0.3)' : (element.backgroundColor || '#ffffff')}
                  stroke={isSelected ? 'lightblue' : (element.borderColor || 'transparent')}
                  strokeWidth={isSelected ? 2 : (element.borderWidth || 0)}
                  dash={isSelected ? [10, 5] : []}
                  cornerRadius={[
                    element.borderTopLeftRadius || 0,
                    element.borderTopRightRadius || 0,
                    element.borderBottomRightRadius || 0,
                    element.borderBottomLeftRadius || 0,
                  ]}
                  {...xrayProps}
                />
              </Group>
            );
            break;    default:
      component = (
        <Rect
          key={element.id}
          {...commonProps}
          ref={shapeRef}
          fill={element.backgroundColor || '#E0E0E0'}
          stroke={element.borderColor || '#212121'}
          strokeWidth={element.borderWidth ?? 1}
          {...xrayProps}
        />
      );
      break;
  }

  return (
    <Fragment>
      {component}
      {isSelected && !isReadOnly && (
                  <Transformer
                    ref={trRef}
                    keepRatio={element.type === 'circle'}
                    rotateEnabled={false}
                    enabledAnchors={['bottom-right', 'middle-right', 'bottom-center']}
                    anchorSize={5}
                    anchorFill={'blue'}
                    anchorCornerRadius={3}
                    ignoreStroke={true}
                    centeredScaling={false}
                    onTransformEnd={(e) => {
              const node = shapeRef.current;
              if (!node) return;

              // Use client rect which reflects the node's bounding box after transforms
              // This handles cases where scaling was done from left/top anchors correctly
              // and gives us the top-left coordinates and size in the parent's coordinate space.
              const clientRect = node.getClientRect({ skipTransform: false });

              // Reset scale so Konva internal state matches baked dimensions
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);

              // Determine new size using client rect (already accounts for transform)
              let newWidth = Math.max(getElementMinimumSize(element.type), clientRect.width);
              let newHeight = Math.max(getElementMinimumSize(element.type), clientRect.height);

              // For circle, ensure it's square and convert client rect center to top-left
              let absoluteX = clientRect.x;
              let absoluteY = clientRect.y;
              if (element.type === 'circle') {
                const maxSide = Math.max(newWidth, newHeight);
                newWidth = newHeight = maxSide;
                // Konva circle positioning: the node's x/y is the center when rendered as Circle.
                // clientRect.x/y for a circle already gives top-left of bounding box, so use it directly.
              }

              // Bake the new width/height into the node so subsequent operations read correct values
              try {
                node.width(newWidth);
                node.height(newHeight);
              } catch (err) {
                // Some Konva node types may not support width/height setters the same way; ignore safely
              }

              // Debug info to help diagnose parent/container shifts when resizing from left/top
              try {
                const stage = node.getStage ? node.getStage() : undefined;
                const stageRect = stage && stage.container ? stage.container().getBoundingClientRect() : null;
                // eslint-disable-next-line no-console
                console.debug('[WireframeCanvas] onTransformEnd:', { elementId: element.id, clientRect, scaleX, scaleY, stageRect, nodeBounds: { x: node.x(), y: node.y(), width: node.width(), height: node.height() } });
              } catch (err) {
                // ignore
              }

              onElementTransformEnd(
                element.id,
                Math.round(absoluteX),
                Math.round(absoluteY),
                Math.round(newWidth),
                Math.round(newHeight)
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
  pixelRatio,
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
  isReadOnly = false,
  isXRayMode = false,
}, ref) => {

  useEffect(() => {
    const stage = (ref as React.MutableRefObject<Konva.Stage>)?.current;
    if (stage && stage.container()) {
      stage.container().style.cursor = 'default';
    }
  }, [ref]);

  const renderElementAndChildren = (element: WireframeElement) => {
    if (element.type === 'frame') {
      const children = element.child || [];
      return (
        <Group
          key={element.id}
          x={element.x}
          y={element.y}
          draggable={!isReadOnly}
          onDragEnd={(e) => {
            if (e.target === e.currentTarget) {
              onElementDragEnd(element.id, e.currentTarget.x(), e.currentTarget.y());
            }
          }}
          dragBoundFunc={(pos) => {
            const newX = Math.max(0, Math.min(pos.x, canvasDimensions.width - element.width));
            const newY = Math.max(0, Math.min(pos.y, canvasDimensions.height - element.height));
            return { x: newX, y: newY };
          }}
        >
          {/* Render the frame itself, but as a non-draggable part of the group */}
          <CanvasElement
            element={{ ...element, x: 0, y: 0 }}
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
            draggable={false} // The group is draggable, not the inner element
            isReadOnly={isReadOnly}
            isXRayMode={isXRayMode}
          />
          {/* Render children recursively */}
          {children.map(child => renderElementAndChildren(child))}
        </Group>
      );
    }

    // Render a single, non-frame element
    return (
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
        isReadOnly={isReadOnly}
        isXRayMode={isXRayMode}
      />
    );
  };

  return (
    <div style={{ border: '1px solid #ccc', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <Stage
        ref={ref as React.RefObject<Konva.Stage>}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        pixelRatio={pixelRatio}
        className="bg-white"
        onMouseDown={onCanvasMouseDown}
      >
        <GridOverlay width={canvasDimensions.width} height={canvasDimensions.height} gridConfig={gridConfig} />
        <Layer>
          {wireframe.elements
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(element => renderElementAndChildren(element))}
        </Layer>
      </Stage>
    </div>
  );
});

WireframeCanvas.displayName = 'WireframeCanvas';
