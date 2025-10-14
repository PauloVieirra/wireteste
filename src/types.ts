
export interface DisplayItem {
  id: string;
  type: 'wireframe' | 'mapa_calor';
  name: string;
  createdAt: string;
  resolution?: 'mobile' | 'tablet' | 'desktop';
  wireframe_count?: number;
  projectId?: string;
  tests: UsabilityTest[];
  hasTestData?: boolean;
  original: any;
}

export interface Project {
  id: string;
  name: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  createdAt: string;
  updated_at: string;
  gridConfig?: any;
  components: any[];
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

export interface Wireframe {
  id: string;
  name: string;
  elements: any[];
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

export interface TestSession {
  id: string;
  testId: string;
  userName: string;
  userEmail: string;
  clicks: any[];
  startTime: string;
  endTime?: string;
  completed: boolean;
}
