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
    type: 'DOCUMENT' | 'CANVAS' | 'FRAME' | 'GROUP' | 'RECTANGLE' | 'ELLIPSE' | 'TEXT' | 'VECTOR' | 'COMPONENT' | 'INSTANCE' | 'LINE';
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
}

export interface FigmaFile {
  document: FigmaNode;
  components: { [key: string]: any };
  name: string;
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
  parentFrame: FigmaNode,
  figmaFile: FigmaFile,
  imageUrls?: { [key: string]: string },
  svgUrls?: { [key: string]: string },
  inheritedProps?: { destinationId?: string },
  fontCollector?: Set<string>
): any | null {
  console.log('Processing node:', node.id, node.type, node.name);
  if (!node.absoluteBoundingBox) {
    console.warn('Skipping node without absoluteBoundingBox:', node);
    return null;
  }

  if (node.interactions && node.interactions.length > 0) {
    console.log(`Interactions array for node '${node.name}' (${node.id}):`, JSON.stringify(node.interactions, null, 2));
  }

  const clickInteraction = node.interactions?.find(
    (interaction) =>
      interaction &&
      interaction.trigger &&
      interaction.trigger.type === 'ON_CLICK' &&
      interaction.actions &&
      interaction.actions.length > 0 &&
      interaction.actions[0].type === 'NODE' &&
      interaction.actions[0].navigation === 'NAVIGATE'
  );

  // Prioritize the node's own interaction, but fall back to the one inherited from a parent group.
  const destinationId = clickInteraction?.actions[0].destinationId || inheritedProps?.destinationId;

  if (clickInteraction) {
    console.log(`Interaction found on node '${node.name}' (${node.id}), destination: ${destinationId}`);
  }

  const solidFill = node.fills?.find(p => p.type === 'SOLID' && p.visible !== false);
  const imageFill = node.fills?.find(p => p.type === 'IMAGE' && p.visible !== false);
  const solidStroke = node.strokes?.find(p => p.type === 'SOLID' && p.visible !== false);

  const baseElement = {
    id: node.id,
    name: node.name,
    x: node.absoluteBoundingBox.x - parentFrame.absoluteBoundingBox.x,
    y: node.absoluteBoundingBox.y - parentFrame.absoluteBoundingBox.y,
    width: node.absoluteBoundingBox.width,
    height: node.absoluteBoundingBox.height,
    borderWidth: node.strokeWeight || 0,
    borderColor: solidStroke ? figmaColorToCss(solidStroke.color) : 'transparent',
    backgroundColor: solidFill ? figmaColorToCss(solidFill.color) : 'transparent',
    opacity: node.opacity ?? 1,
    destinationId: destinationId, // Use the correctly resolved destinationId
  };

  if (svgUrls && svgUrls[node.id]) {
    const element = {
      ...baseElement,
      type: 'image',
      imageSrc: svgUrls[node.id],
    };
    console.log('Created SVG image element:', element);
    return element;
  }

  if (imageFill && imageUrls && imageUrls[node.id]) {
    const element = {
      ...baseElement,
      type: 'image',
      imageSrc: imageUrls[node.id],
    };
    console.log('Created image element:', element);
    return element;
  }

  switch (node.type) {
    case 'RECTANGLE':
      const radii = node.rectangleCornerRadii;
      const rectangleElement = {
        ...baseElement,
        type: 'rectangle',
        borderTopLeftRadius: radii ? radii[0] : node.cornerRadius || 0,
        borderTopRightRadius: radii ? radii[1] : node.cornerRadius || 0,
        borderBottomRightRadius: radii ? radii[2] : node.cornerRadius || 0,
        borderBottomLeftRadius: radii ? radii[3] : node.cornerRadius || 0,
      };
      console.log('Created rectangle element:', rectangleElement);
      return rectangleElement;
    case 'ELLIPSE':
      const ellipseElement = {
        ...baseElement,
        type: 'circle',
      };
      console.log('Created ellipse element:', ellipseElement);
      return ellipseElement;
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
      console.log('Created text element:', textElement);
      return textElement;
    case 'VECTOR':
    case 'INSTANCE':
    case 'COMPONENT':
    case 'GROUP':
    case 'FRAME':
      const iconName = getIconNameFromFigmaNode(node);
      if (iconName) {
        const iconElement = {
          ...baseElement,
          type: 'icon',
          iconName: iconName,
          fillColor: solidFill ? figmaColorToCss(solidFill.color) : '#000000',
        };
        console.log('Created icon element:', iconElement);
        return iconElement;
      }

      const frameElement = {
        ...baseElement,
        type: 'frame',
      };

      const childrenElements = node.children?.flatMap(child => {
        // Pass the current node as the parentFrame for correct relative coordinate calculation, and pass down the current element's destinationId.
        const convertedElements = convertNodeToElement(child, node, figmaFile, imageUrls, svgUrls, { destinationId: baseElement.destinationId }, fontCollector);
        if (convertedElements) {
            const elements = Array.isArray(convertedElements) ? convertedElements : [convertedElements];
            if (elements.length > 0) {
                elements[0].parentId = node.id;
            }
        }
        return convertedElements;
      }) || [];

      return [frameElement, ...childrenElements];
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

  const frames = firstCanvas.children?.filter(child => child.type === 'FRAME');
  if (!frames || frames.length === 0) {
    throw new Error("No frames found on the first page. Please ensure your screens are wrapped in Frames.");
  }

  console.log(`Found ${frames.length} frames to import.`);

  const links: { sourceId: string; destinationId: string }[] = [];
  const fontFamilies = new Set<string>();

  const wireframes = frames.map(frame => {
    const elements = frame.children?.flatMap(child => {
      try {
        return convertNodeToElement(child, frame, figmaFile, imageUrls, svgUrls, undefined, fontFamilies);
      } catch (error) {
        console.error('Error converting node:', child, error);
        return null;
      }
    }).filter(Boolean) || [];

    const flattenedElements = elements.flat(Infinity);

    flattenedElements.forEach(element => {
        if (element.destinationId) {
            links.push({
                sourceId: element.id,
                destinationId: element.destinationId,
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