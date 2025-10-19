// src/utils/figmaImporter.ts

// Define interfaces for the parts of the Figma API response we care about.
interface FigmaVector {
  x: number;
  y: number;
}

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  color?: FigmaColor;
  visible?: boolean;
  imageRef?: string; 
}

interface FigmaTypeStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing: number;
  lineHeightPx: number;
  italic: boolean;
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
}

interface FigmaRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FigmaInteractionAction {
    type: 'NODE' | 'BACK' | 'URL';
    destinationId?: string;
    navigation: 'NAVIGATE' | 'SWAP' | 'OVERLAY';
    transition?: any;
    url?: string;
}

interface FigmaInteraction {
    trigger: {
        type: 'ON_CLICK' | 'ON_DRAG' | 'MOUSE_ENTER' | 'MOUSE_LEAVE' | 'MOUSE_UP' | 'MOUSE_DOWN' | 'AFTER_TIMEOUT';
    };
    actions: FigmaInteractionAction[];
}

export interface FigmaNode {
    id: string;
    name: string;
    type: 'DOCUMENT' | 'CANVAS' | 'FRAME' | 'GROUP' | 'RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'VECTOR' | 'COMPONENT' | 'INSTANCE' | 'LINE' | 'COMPONENT_SET';
    absoluteBoundingBox: FigmaRectangle;
    children?: FigmaNode[];
    fills?: FigmaPaint[];
    strokes?: FigmaPaint[];
    strokeWeight?: number;
    cornerRadius?: number;
    rectangleCornerRadii?: [number, number, number, number];
    characters?: string;
    style?: FigmaTypeStyle;
    componentId?: string;
    opacity?: number;
    interactions?: FigmaInteraction[];
    isMask?: boolean;
}

export interface FigmaFile {
  document: FigmaNode;
  components: { [key: string]: any };
  name: string;
}

function findNodeById(node: FigmaNode, id: string): FigmaNode | null {
    if (node.id === id) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

function figmaColorToCss(color: FigmaColor | undefined): string {
    if (!color) {
        return 'transparent';
    }
    const { r, g, b, a } = color;
    if (a === 1) {
        const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } else {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(2)})`;
    }
}

function getIconNameFromFigmaNode(node: FigmaNode): string | null {
  const name = node.name.toLowerCase();
  if (name.startsWith('icon')) {
    const parts = name.split(/[\/\s-]/);
    const iconName = parts.pop();
    if (iconName) {
      return iconName;
    }
  }
  return null;
}

function convertNodeToElement(
  node: FigmaNode,
  rootFrame: FigmaNode, // Changed: This is always the top-level frame
  figmaFile: FigmaFile,
  imageUrls?: { [key: string]: string },
  svgUrls?: { [key: string]: string },
  inheritedProps?: { destinationId?: string },
  fontCollector?: Set<string>
): any | null {
  if (!node.absoluteBoundingBox || node.type === 'COMPONENT_SET') {
    console.warn('Skipping node without absoluteBoundingBox or of type COMPONENT_SET:', node);
    return null;
  }

  const clickInteraction = node.interactions?.find(
    (interaction) =>
      interaction?.trigger?.type === 'ON_CLICK' &&
      interaction.actions?.[0]?.type === 'NODE' &&
      interaction.actions[0].navigation === 'NAVIGATE'
  );

  const destinationId = clickInteraction?.actions[0].destinationId || inheritedProps?.destinationId;

  const solidFill = node.fills?.find(p => p.type === 'SOLID' && p.visible !== false);
  const imageFill = node.fills?.find(p => p.type === 'IMAGE' && p.visible !== false);
  const solidStroke = node.strokes?.find(p => p.type === 'SOLID' && p.visible !== false);

  const baseElement = {
    id: node.id,
    name: node.name,
    // Corrected: Position is always relative to the root frame
    x: node.absoluteBoundingBox.x - rootFrame.absoluteBoundingBox.x,
    y: node.absoluteBoundingBox.y - rootFrame.absoluteBoundingBox.y,
    width: node.absoluteBoundingBox.width,
    height: node.absoluteBoundingBox.height,
    borderWidth: node.strokeWeight || 0,
    borderColor: solidStroke ? figmaColorToCss(solidStroke.color) : 'transparent',
    backgroundColor: solidFill ? figmaColorToCss(solidFill.color) : 'transparent',
    opacity: node.opacity ?? 1,
    navigationTarget: destinationId,
  };

  const hasChildren = !!(node.children && node.children.length > 0);
  const isComponentOrInstance = node.type === 'COMPONENT' || node.type === 'INSTANCE';

  if (node.type === 'GROUP' || node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
    const containerElement = {
        ...baseElement,
        type: 'frame', // Treat all these as simple container frames in our tool
        // Make the container itself transparent by default unless it has its own fill
        backgroundColor: solidFill ? figmaColorToCss(solidFill.color) : 'transparent',
    };

    const childrenElements = node.children?.flatMap(child => {
        // Corrected: Pass down the rootFrame, not the current node
        return convertNodeToElement(child, rootFrame, figmaFile, imageUrls, svgUrls, { destinationId: baseElement.navigationTarget }, fontCollector);
    }).filter(Boolean) || [];

    // We return the children directly, and the container is just for positioning them.
    // The container itself isn't added as a separate element unless it has a visual style.
    if (containerElement.backgroundColor === 'transparent' && containerElement.borderWidth === 0) {
        return childrenElements.flat(Infinity);
    }
    
    // If the container has a style, add it to the list.
    return [containerElement, ...childrenElements.flat(Infinity)];
  }

  if ((node.type === 'VECTOR' || (!hasChildren && !isComponentOrInstance)) && svgUrls && svgUrls[node.id]) {
    return {
      ...baseElement,
      type: 'image',
      imageSrc: svgUrls[node.id],
    };
  }

  if ((node.type === 'VECTOR' || (!hasChildren && !isComponentOrInstance)) && imageFill && imageUrls && imageUrls[node.id]) {
    return {
      ...baseElement,
      type: 'image',
      imageSrc: imageUrls[node.id],
    };
  }

  switch (node.type) {
    case 'RECTANGLE':
      const radii = node.rectangleCornerRadii;
      return {
        ...baseElement,
        type: 'rectangle',
        borderTopLeftRadius: radii ? radii[0] : node.cornerRadius || 0,
        borderTopRightRadius: radii ? radii[1] : node.cornerRadius || 0,
        borderBottomRightRadius: radii ? radii[2] : node.cornerRadius || 0,
        borderBottomLeftRadius: radii ? radii[3] : node.cornerRadius || 0,
      };
    case 'ELLIPSE':
      return {
        ...baseElement,
        type: 'circle',
      };
    case 'TEXT':
      const textElement = {
        ...baseElement,
        type: 'text',
        text: node.characters || '',
        textColor: solidFill ? figmaColorToCss(solidFill.color) : '#000000',
        fontSize: node.style?.fontSize || 16,
        fontFamily: node.style?.fontFamily || 'Inter',
        fontWeight: node.style?.fontWeight || 400,
        fontStyle: node.style?.italic ? 'italic' : 'normal',
        textAlign: node.style?.textAlignHorizontal.toLowerCase() || 'left',
        lineHeight: node.style?.lineHeightPx,
        letterSpacing: node.style?.letterSpacing,
        textDecoration: node.style?.textDecoration === 'UNDERLINE' ? 'underline' : node.style?.textDecoration === 'STRIKETHROUGH' ? 'line-through' : 'none',
        textAutoResize: node.style?.textAutoResize,
      };
      if (fontCollector && textElement.fontFamily) {
        fontCollector.add(textElement.fontFamily);
      }
      return textElement;
    case 'LINE':
        return {
            ...baseElement,
            type: 'line',
            height: baseElement.borderWidth, // For lines, height is the stroke weight
            backgroundColor: baseElement.borderColor, // The color is the stroke color
            borderWidth: 0, // It's not a border, it's a fill
        };
    default:
      console.warn('Skipping unhandled node type:', node.type, node);
      return null;
  }
}

export function convertFigmaToWireframes(figmaFile: FigmaFile, imageUrls?: { [key: string]: string }, svgUrls?: { [key: string]: string }) {
  console.log("Starting Figma to Wireframe conversion...");

  const canvases = figmaFile.document.children?.filter(child => child.type === 'CANVAS');
  if (!canvases || canvases.length === 0) {
    throw new Error("No canvases found in the Figma file.");
  }

  const firstCanvas = canvases[0];

  const frames = firstCanvas.children?.filter(child => child.type === 'FRAME' && child.absoluteBoundingBox);
  if (!frames || frames.length === 0) {
    throw new Error("No frames found on the first page. Please ensure your screens are wrapped in Frames.");
  }

  console.log(`Found ${frames.length} frames to import.`);

  const links: { sourceId: string; destinationId: string }[] = [];
  const fontFamilies = new Set<string>();

  const wireframes = frames.map(frame => {
    const elements = frame.children?.flatMap(child => {
      try {
        // Corrected: Pass the top-level frame as the root for positioning
        return convertNodeToElement(child, frame, figmaFile, imageUrls, svgUrls, undefined, fontFamilies);
      } catch (error) {
        console.error('Error converting node:', child, error);
        return null;
      }
    }).filter(Boolean) || [];

    const flattenedElements = elements.flat(Infinity);

    flattenedElements.forEach(element => {
        if (element.navigationTarget) {
            links.push({
                sourceId: element.id,
                destinationId: element.navigationTarget,
            });
        }
    });

    return {
      id: frame.id,
      name: frame.name,
      width: frame.absoluteBoundingBox.width,
      height: frame.absoluteBoundingBox.height,
      elements: flattenedElements,
    };
  });

  console.log("Used font families:", Array.from(fontFamilies));
  return { wireframes, links, fontFamilies: Array.from(fontFamilies) };
}
