import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Users, 
  MousePointer, 
  Target, 
  Clock
} from 'lucide-react';
import { useDashboard } from './DashboardProvider';
import { getProjectById, getTestById } from '../utils/supabase/supabaseClient';

// --- NEW DATA STRUCTURES (Matching App.tsx) ---

interface MasterComponent {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
  path: string;
  fills: any[];
  strokes: any[];
  defaultWidth: number;
  defaultHeight: number;
  backgroundColor?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
}

interface WireframeElement { // Instance
  id: string;
  componentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
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
  id: string;
  name: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  createdAt: string;
  components: MasterComponent[];
}

interface UsabilityTest {
    id: string;
    admin_id: string;
    name: string;
    type: 'mapa_calor' | 'eye_tracking' | 'face_tracking';
    config: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Click {
  x: number;
  y: number;
  wireframeId: string;
  timestamp: string;
  correct: boolean;
}

interface TestSession {
  id: string;
  testId: string;
  userName: string;
  userEmail: string;
  clicks: Click[];
  startTime: string;
  endTime?: string;
  completed: boolean;
}

interface WireframeHeatmapDashboardProps {
  itemId: string;
  itemType: 'wireframe' | 'mapa_calor';
}

export function WireframeHeatmapDashboard({ itemId, itemType }: WireframeHeatmapDashboardProps) {
  const { data: testSessions, loading: sessionsLoading, error: sessionsError } = useDashboard();
  const [project, setProject] = useState<Project | null>(null);
  const [test, setTest] = useState<UsabilityTest | null>(null);
  const [loadingProjectTest, setLoadingProjectTest] = useState(true);
  const [projectTestError, setProjectTestError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectAndTest = async () => {
      setLoadingProjectTest(true);
      setProjectTestError(null);
      try {
        let fetchedProject: Project | null = null;
        let fetchedTest: UsabilityTest | null = null;

        if (itemType === 'wireframe') {
          fetchedProject = await getProjectById(itemId);
        } else if (itemType === 'mapa_calor') {
          fetchedTest = await getTestById(itemId);
          if (fetchedTest?.config?.projectId) {
            fetchedProject = await getProjectById(fetchedTest.config.projectId);
          }
        }
        
        setProject(fetchedProject);
        setTest(fetchedTest);

      } catch (err: any) {
        console.error("Error fetching project/test data:", err);
        setProjectTestError(`Erro ao carregar dados do projeto/teste: ${err.message}`);
      } finally {
        setLoadingProjectTest(false);
      }
    };

    if (itemId) {
      fetchProjectAndTest();
    }
  }, [itemId, itemType]);

  const [selectedWireframe, setSelectedWireframe] = useState('');
  const [zoom, setZoom] = useState(0.5);

  // Efeito para selecionar a primeira tela por padrão
  useEffect(() => {
    if (project && project.wireframes.length > 0 && !selectedWireframe) {
      setSelectedWireframe(project.wireframes[0].id);
    }
  }, [project, selectedWireframe]);


  const getCanvasDimensions = () => {
    if (!project) return { width: 375, height: 812 };
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 375, height: 812 };
    }
  };

  const relevantSessions = testSessions as TestSession[];

  const analytics = useMemo(() => {
    if (!project || relevantSessions.length === 0) {
      return { totalSessions: 0, completionRate: 0, avgClicksPerSession: 0, avgTimePerSession: 0, wireframeAnalytics: [], clickHeatmap: [] };
    }

    const totalSessions = relevantSessions.length;
    const completedSessions = relevantSessions.filter(s => s.completed).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const totalClicks = relevantSessions.reduce((sum, s) => sum + s.clicks.length, 0);
    const avgClicksPerSession = totalSessions > 0 ? totalClicks / totalSessions : 0;
    const sessionTimes = relevantSessions.filter(s => s.endTime).map(s => new Date(s.endTime!).getTime() - new Date(s.startTime).getTime());
    const avgTimePerSession = sessionTimes.length > 0 ? sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length / 1000 : 0;

    const wireframeAnalytics = project.wireframes.map(wireframe => {
      const wireframeClicks = relevantSessions.reduce((acc, session) => acc + session.clicks.filter(c => c.wireframeId === wireframe.id).length, 0);
      const correctClicks = relevantSessions.reduce((acc, session) => acc + session.clicks.filter(c => c.wireframeId === wireframe.id && c.correct).length, 0);
      const sessionsOnWireframe = relevantSessions.filter(s => s.clicks.some(c => c.wireframeId === wireframe.id)).length;
      return { name: wireframe.name, totalClicks: wireframeClicks, correctClicks, accuracy: wireframeClicks > 0 ? (correctClicks / wireframeClicks) * 100 : 0, visitCount: sessionsOnWireframe };
    });

    const clickHeatmap = relevantSessions.reduce((acc, session) => {
      session.clicks.forEach(click => acc.push({ ...click, intensity: 1 }));
      return acc;
    }, [] as any[]);

    return { totalSessions, completionRate, avgClicksPerSession, avgTimePerSession, wireframeAnalytics, clickHeatmap };
  }, [project, relevantSessions]);

  const currentWireframe = project?.wireframes.find(w => w.id === selectedWireframe);
  const currentWireframeClicks = analytics.clickHeatmap.filter(c => c.wireframeId === selectedWireframe);
  const canvasDimensions = getCanvasDimensions();

  const createHeatmapClusters = (clicks: any[]) => {
    const clusters: any[] = [];
    const clusterRadius = 40;
    clicks.forEach(click => {
      const existingCluster = clusters.find(cluster => Math.sqrt(Math.pow(cluster.x - click.x, 2) + Math.pow(cluster.y - click.y, 2)) <= clusterRadius);
      if (existingCluster) {
        existingCluster.intensity += 1;
        existingCluster.correct = existingCluster.correct || click.correct;
        existingCluster.x = (existingCluster.x * (existingCluster.intensity - 1) + click.x) / existingCluster.intensity;
        existingCluster.y = (existingCluster.y * (existingCluster.intensity - 1) + click.y) / existingCluster.intensity;
      } else {
        clusters.push({ x: click.x, y: click.y, intensity: 1, correct: click.correct, id: `cluster-${clusters.length}` });
      }
    });
    return clusters;
  };

  const heatmapClusters = createHeatmapClusters(currentWireframeClicks);

  const exportReport = () => {
    console.log('Exporting report...', analytics);
    alert('Funcionalidade de exportação em desenvolvimento!');
  };

  if (sessionsLoading || loadingProjectTest) {
    return <div className="p-6 text-center">Carregando dados do dashboard...</div>;
  }

  if (sessionsError || projectTestError) {
    return <div className="p-6 text-center text-red-500">Erro ao carregar dashboard: {sessionsError || projectTestError}</div>;
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2>Dashboard de Resultados</h2>
        <p className="text-muted-foreground mb-6">Projeto não encontrado ou não carregado.</p>
      </div>
    );
  }
  
  if (relevantSessions.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2>Dashboard de Resultados - {project.name}</h2>
        <p className="text-muted-foreground mb-6">Nenhuma sessão de teste registrada para este projeto ainda.</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Coluna Principal (3/5 da tela) */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Dashboard - {project.name}</h2>
            <p className="text-muted-foreground">Análise de usabilidade e mapas de calor</p>
          </div>
          <Button onClick={exportReport}><Download className="w-4 h-4 mr-2" />Exportar relatório</Button>
        </div>

<div className="d-flex flex-row w-100 justify-content-between" style={{display:"flex", backgroundColor:"#000"}}>
  
     <div style={{ width: '70%', padding:"16px" }} > 
       
<div className="grid grid-cols-4 gap-4">
  <Card className="w-full p-2 text-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
      <CardTitle className="text-xs font-medium">Total de Sessões</CardTitle>
      <Users className="h-3 w-3 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-1">
      <div className="text-lg font-bold">{analytics.totalSessions}</div>
      <p className="text-[10px] text-muted-foreground">usuários testaram</p>
    </CardContent>
  </Card>

  <Card className="w-full p-2 text-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
      <CardTitle className="text-xs font-medium">Taxa de Conclusão</CardTitle>
      <Target className="h-3 w-3 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-1">
      <div className="text-lg font-bold">{analytics.completionRate.toFixed(1)}%</div>
      <p className="text-[10px] text-muted-foreground">completaram o teste</p>
    </CardContent>
  </Card>

  <Card className="w-full p-2 text-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
      <CardTitle className="text-xs font-medium">Cliques Médios</CardTitle>
      <MousePointer className="h-3 w-3 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-1">
      <div className="text-lg font-bold">{analytics.avgClicksPerSession.toFixed(1)}</div>
      <p className="text-[10px] text-muted-foreground">por sessão</p>
    </CardContent>
  </Card>

  <Card className="w-full p-2 text-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
      <CardTitle className="text-xs font-medium">Tempo Médio</CardTitle>
      <Clock className="h-3 w-3 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-1">
      <div className="text-lg font-bold">{(analytics.avgTimePerSession / 60).toFixed(1)}m</div>
      <p className="text-[10px] text-muted-foreground">por sessão</p>
    </CardContent>
  </Card>
</div>


     
       <div style={{backgroundColor:"#e71111ff"}}> 
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Análise por Tela</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Performance por Tela</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.wireframeAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#8884d8" name="Precisão (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Distribuição de Cliques</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={analytics.wireframeAnalytics} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="totalClicks" label={({ name, value }) => `${name}: ${value}`}>
                        {analytics.wireframeAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Análise Detalhada</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.wireframeAnalytics.map((wireframe, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{wireframe.name}</h4>
                        <p className="text-sm text-muted-foreground">{wireframe.visitCount} usuário{wireframe.visitCount !== 1 ? 's' : ''} visitaram</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{wireframe.accuracy.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">{wireframe.correctClicks}/{wireframe.totalClicks} corretos</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Sessões de Teste</CardTitle><p className="text-sm text-muted-foreground">Histórico de todos os usuários que testaram</p></CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {relevantSessions.map((session) => {
                    const duration = session.endTime ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 : 0;
                    return (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div>
                          <h4 className="font-medium">{session.userName}</h4>
                          <p className="text-sm text-muted-foreground">{session.userEmail}</p>
                          <p className="text-xs text-muted-foreground">{new Date(session.startTime).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <div><Badge variant={session.completed ? 'default' : 'secondary'}>{session.completed ? 'Concluído' : 'Incompleto'}</Badge></div>
                          <div className="text-sm text-muted-foreground mt-1">{session.clicks.length} cliques • {duration > 0 ? `${Math.round(duration)}s` : '-'}</div>
                          <div className="text-sm text-muted-foreground">{Math.round((session.clicks.filter(c => c.correct).length / session.clicks.length) * 100) || 0}% precisão</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
 </div>
 <div style={{ width: '30%', padding:"16px" }} > 
      {/* Coluna do Heatmap (2/5 da tela) */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="sticky top-6 h-[calc(100vh-3rem)]">
          <CardHeader>
            <CardTitle className="text-lg">Mapa de Calor</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{currentWireframeClicks.length} cliques</span>
              <span>•</span>
              <span>{heatmapClusters.length} clusters</span>
            </div>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            {/* Seletor de Tela */}
            <div className="mb-4">
              <Select onValueChange={setSelectedWireframe} value={selectedWireframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma tela" />
                </SelectTrigger>
                <SelectContent>
                  {project.wireframes.map((wireframe) => (
                    <SelectItem key={wireframe.id} value={wireframe.id}>
                      {wireframe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Visualização do Heatmap */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {currentWireframe ? (
                <div className="relative shadow-sm" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                  <div className="bg-white border-2 border-gray-300" style={{ width: canvasDimensions.width, height: canvasDimensions.height }}>
                    {currentWireframe.elements.map((element) => {
                      const master = project.components?.find(c => c.id === element.componentId);
                      if (!master) return null;
                      const bgColor = element.overrides?.backgroundColor || master.backgroundColor;
                      const text = element.overrides?.text;
                      return (
                        <div
                          key={element.id}
                          className={`absolute border-2 ${master.type === 'circle' ? 'rounded-full' : 'rounded'}`}
                          style={{
                            left: element.x, top: element.y, width: element.width, height: element.height,
                            backgroundColor: bgColor || 'transparent',
                            borderColor: master.borderColor || '#000',
                            borderWidth: master.borderWidth || 0
                          }}
                        >
                          {text && <span className="text-gray-700 select-none overflow-hidden text-xs">{text}</span>}
                        </div>
                      );
                    })}

                    {heatmapClusters.map((cluster, index) => {
                      const intensityMultiplier = Math.min(cluster.intensity * 0.3 + 0.7, 2.5);
                      const baseSize = 50;
                      const randomVariation = Math.sin(index * 2.3) * 0.3 + 1;
                      const size = baseSize * intensityMultiplier * randomVariation;
                      const alphaMultiplier = Math.min(cluster.intensity * 0.2 + 0.4, 1);
                      return (
                        <div
                          key={cluster.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: cluster.x - size / 2, top: cluster.y - size / 2,
                            width: size, height: size,
                            background: cluster.correct 
                              ? `radial-gradient(ellipse, rgba(220, 38, 127, ${0.8 * alphaMultiplier}) 0%, rgba(255, 255, 0, ${0.25 * alphaMultiplier}) 65%, transparent 100%)` 
                              : `radial-gradient(ellipse, rgba(220, 38, 38, ${0.75 * alphaMultiplier}) 0%, rgba(255, 255, 0, ${0.2 * alphaMultiplier}) 70%, transparent 100%)`,
                            borderRadius: `${35 + Math.sin(index * 1.7) * 25}% ${65 + Math.cos(index * 2.1) * 20}% ${40 + Math.sin(index * 1.3) * 30}% ${60 + Math.cos(index * 1.9) * 15}%`,
                            transform: `rotate(${index * 37}deg) scale(${0.7 + Math.sin(index * 1.5) * 0.5})`,
                            filter: 'blur(1.5px)',
                            mixBlendMode: 'multiply',
                            zIndex: 10 + cluster.intensity
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Selecione uma tela para ver o mapa de calor.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  </div>
      </div>
    </div>
    </div>
  );
}
