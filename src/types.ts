export interface WireframeElement {
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
  imageMode?: 'cover' | 'contain' | 'fill' | 'none';
  imageCrop?: { x: number; y: number; width: number; height: number } | null;
  videoSrc?: string;
  navigationTarget?: string;
  child?: WireframeElement[];
  name?: string;
  opacity?: number;
  grayscale?: number;
  // Advanced text properties
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textBorderColor?: string;
  textBorderWidth?: number;
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'WIDTH';
  // Auto Layout properties for frames
  layoutMode?: 'none' | 'horizontal' | 'vertical';
  padding?: number; // Keep for backward compatibility
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  sourceComponentId?: string;
  isComponent?: boolean;
  id_componente?: string;
}

export interface Wireframe {
  id: string;
  name: string;
  elements: WireframeElement[];
  width?: number;
  height?: number;
  // Auto Layout properties for wireframe
  layoutMode?: 'none' | 'horizontal' | 'vertical';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
}

export interface GridConfig {
  enabled: boolean;
  columns: number;
  gap: number;
  margin: number;
  color: 'red';
  opacity: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  resolution: 'mobile' | 'tablet' | 'desktop' | 'custom';
  width?: number;
  height?: number;
  wireframes: Wireframe[];
  createdAt: string;
  updated_at: string;
  gridConfig?: GridConfig;
  components?: WireframeElement[];
  figmaFileKey?: string;
  figmaToken?: string;
}

export interface DisplayItem {
  id: string;
  type: 'wireframe' | 'mapa_calor' | 'survey';
  name: string;
  createdAt: string;
  resolution?: 'mobile' | 'tablet' | 'desktop';
  wireframe_count?: number;
  question_count?: number;
  projectId?: string;
  tests: UsabilityTest[];
  hasTestData?: boolean;
  original: any;
}

export interface Survey {
  id: string;
  name: string;
  type: 'qualitativa' | 'quantitativa' | 'satisfacao';
  questions: any[];
  createdAt: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  projectsCreated: number;
  reportsGenerated: number;
  role: 'admin' | 'user' | 'tester'; // Added 'tester' role
}

export interface Test {
  id: string;
  projectId: string;
  name: string;
  hotspots: any[];
  flows: any[];
  sharedWithUserEmail?: string;
}

export interface UsabilityTest {
    id: string;
    admin_id: string;
    name: string;
    type: 'mapa_calor' | 'eye_tracking' | 'face_tracking';
    config: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Click {
  x: number;
  y: number;
  wireframeId: string;
  timestamp: string;
  correct: boolean;
}

export interface TestSession {
  id:string;
  testId: string;
  userName: string;
  userEmail: string;
  clicks: Click[];
  answers?: { [questionId: string]: any };
  startTime: string;
  endTime?: string;
  completed: boolean;
  duration?: number;
  clicksPerWireframe?: { [wireframeId: string]: number };
  timePerWireframe?: { [wireframeId: string]: number };
  correctClicks?: number;
  incorrectClicks?: number;
  idleTime?: number;
}