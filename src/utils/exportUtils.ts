import JSZip from 'jszip';
import { saveAs } from 'file-saver'; // Note: This will need to be installed

// --- DATA STRUCTURES (should match App.tsx) ---

interface MasterComponent {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
  path: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface WireframeElement { // Instance
  id: string;
  componentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  overrides?: {
    text?: string;
    backgroundColor?: string;
  }
}

interface Wireframe {
  id: string;
  name: string;
  elements: WireframeElement[];
}

interface Project {
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  components: MasterComponent[];
}

/**
 * Generates an SVG string from a single wireframe.
 * This function converts the wireframe's data structure into a valid SVG file content.
 */
export const generateSVG = (wireframe: Wireframe, project: Project): string => {
  const getCanvasDimensions = () => {
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 375, height: 812 };
    }
  };
  const { width, height } = getCanvasDimensions();

  const elementsSVG = wireframe.elements.map(element => {
    const master = project.components.find(c => c.id === element.componentId);
    if (!master) return '';

    const props = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      fill: element.overrides?.backgroundColor || master.backgroundColor || 'transparent',
      stroke: master.borderColor || '#000',
      strokeWidth: master.borderWidth || 1,
    };

    switch (master.type) {
      case 'circle':
        return `<circle cx="${props.x + props.width / 2}" cy="${props.y + props.height / 2}" r="${props.width/2}" fill="${props.fill}" stroke="${props.stroke}" stroke-width="${props.strokeWidth}" />`;
      case 'text':
      case 'button':
        const textContent = element.overrides?.text || (master.type === 'button' ? 'Button' : 'Text');
        return `<g transform="translate(${props.x}, ${props.y})"><rect width="${props.width}" height="${props.height}" fill="${props.fill}" stroke="${props.stroke}" stroke-width="${props.strokeWidth}" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${master.textColor || '#000'}">${textContent}</text></g>`;
      case 'rectangle':
      default:
        return `<rect x="${props.x}" y="${props.y}" width="${props.width}" height="${props.height}" fill="${props.fill}" stroke="${props.stroke}" stroke-width="${props.strokeWidth}" />`;
    }
  }).join('\n  ');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${elementsSVG}
</svg>`;
};

/**
 * Triggers a browser download for a given file content.
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, filename);
};

/**
 * Creates and downloads a ZIP file containing multiple SVGs.
 */
export const downloadSVGZip = async (wireframes: Wireframe[], project: Project) => {
  const zip = new JSZip();
  wireframes.forEach(wireframe => {
    const svgContent = generateSVG(wireframe, project);
    zip.file(`${wireframe.name}.svg`, svgContent);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${project.name || 'projeto'}-svg.zip`);
};

// Placeholder for PNG generation - this is a complex task
export const generatePNG = async (wireframe: Wireframe, project: Project): Promise<string> => {
  // In a real implementation, this would render the WireframeCanvas to an offscreen canvas
  // and use toDataURL() to get the image data.
  console.warn("PNG generation is a placeholder.");
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 transparent pixel
}

/**
 * Creates and downloads a ZIP file containing SVGs and PNGs (heatmaps).
 */
export const downloadSVGAndHeatmapZip = async (wireframes: Wireframe[], project: Project) => {
  const zip = new JSZip();
  
  for (const wireframe of wireframes) {
    const svgContent = generateSVG(wireframe, project);
    zip.file(`wireframes/${wireframe.name}.svg`, svgContent);

    // This is where you would get real heatmap data
    const pngDataUrl = await generatePNG(wireframe, project);
    const pngBlob = await (await fetch(pngDataUrl)).blob();
    zip.file(`heatmaps/${wireframe.name}-heatmap.png`, pngBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${project.name || 'projeto'}-full.zip`);
};
