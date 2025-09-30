import React, { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useDashboard } from './DashboardProvider';
import { getProjectById, getTestById } from '../utils/supabase/supabaseClient';
import { useLoading } from './GlobalLoading'; // Importar useLoading

// --- DATA STRUCTURES ---

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
  componentId?: string; // Pode não ser necessário se as propriedades estiverem no elemento
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  // Propriedades adicionadas diretamente do project_data
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
  navigationTarget?: string; // Para botões de navegação
  textLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'; // Para elementos de texto
  path?: string; // Para imagens/ícones
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
  description?: string;
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
  duration?: number; // Added duration
  clicksPerWireframe?: { [wireframeId: string]: number }; // Added clicks per wireframe
  correctClicks?: number; // Added correct clicks
  incorrectClicks?: number; // Added incorrect clicks
  idleTime?: number; // Added idle time
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null); // Novo estado para sessão individual

  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframeScale, setWireframeScale] = useState(1);
  const { showLoading, hideLoading } = useLoading(); // Usar o hook de loading
  
  useEffect(() => {
    const fetchProjectAndTest = async () => {
      showLoading("Carregando dados do projeto/teste..."); // Ativar loading
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
        console.log('[WireframeHeatmapDashboard] Project loaded:', fetchedProject);
        console.log('[WireframeHeatmapDashboard] Project components:', fetchedProject?.components);

      } catch (err: any) {
        console.error("Error fetching project/test data:", err);
        setProjectTestError(`Erro ao carregar dados do projeto/teste: ${err.message}`);
      } finally {
        hideLoading(); // Desativar loading quando os dados estiverem prontos
        setLoadingProjectTest(false);
      }
    };

    if (itemId) {
      fetchProjectAndTest();
    }
  }, [itemId, itemType]);

  const [selectedWireframe, setSelectedWireframe] = useState(''); // Estado para a tela selecionada
  const [displayMode, setDisplayMode] = useState<'single_wireframe' | 'global_heatmap'>('single_wireframe'); // Novo estado para o modo de visualização

  useEffect(() => {
    if (project && project.wireframes.length > 0 && !selectedWireframe) {
      setSelectedWireframe(project.wireframes[0].id);
    }
  }, [project, selectedWireframe]);

  const getCanvasDimensions = useMemo(() => {
    if (!project) return { width: 375, height: 812 }; // Default fallback
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 375, height: 812 };
    }
  }, [project]);

  useLayoutEffect(() => {
    const calculateScale = () => {
      if (containerRef.current && project) {
        const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
        const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions;

        if (canvasWidth <= 0 || canvasHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) return;

        const availableWidth = containerWidth - 32; // p-4
        const availableHeight = containerHeight - 32; // p-4

        const scaleX = availableWidth / canvasWidth;
        const scaleY = availableHeight / canvasHeight;

        const newScale = Math.min(scaleX, scaleY);
        
        setWireframeScale(newScale > 0 ? newScale : 0);
      }
    };

    calculateScale();
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();

  }, [project, selectedWireframe, getCanvasDimensions]);

  const relevantSessions = testSessions as TestSession[];

  const displayedSessions = useMemo(() => {
    if (selectedSessionId) {
      return relevantSessions.filter(session => session.id === selectedSessionId);
    }
    return relevantSessions;
  }, [relevantSessions, selectedSessionId]);

  const analytics = useMemo(() => {
    if (!project || displayedSessions.length === 0) {
      return { totalSessions: 0, completionRate: 0, avgClicksPerSession: 0, avgTimePerSession: 0, wireframeAnalytics: [], clickHeatmap: [] };
    }

    const allClicks = displayedSessions.flatMap(session => session.clicks);

    // Filtra as sessões para incluir apenas aquelas que interagiram com a tela selecionada, se houver.
    const sessionsForWireframeAnalytics = (displayMode === 'single_wireframe' && selectedWireframe)
      ? displayedSessions.filter(session => session.clicks.some(click => click.wireframeId === selectedWireframe))
      : displayedSessions; // Se global_heatmap, todas as sessões são relevantes para a análise de métricas gerais

    const totalSessions = sessionsForWireframeAnalytics.length;
    const completedSessions = sessionsForWireframeAnalytics.filter(s => s.completed).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Clicks totais para a tela selecionada (ou todas as telas se nenhuma for selecionada ou global_heatmap)
    const totalClicksOnDisplayedWireframes = (displayMode === 'single_wireframe' && selectedWireframe)
      ? sessionsForWireframeAnalytics.reduce((sum, s) => 
          sum + s.clicks.filter(c => c.wireframeId === selectedWireframe).length, 0
        )
      : allClicks.length; // Se global, conte todos os cliques de todas as sessões exibidas

    const avgClicksPerSession = totalSessions > 0 ? totalClicksOnDisplayedWireframes / totalSessions : 0;

    const sessionTimes = sessionsForWireframeAnalytics.filter(s => s.endTime).map(s => new Date(s.endTime!).getTime() - new Date(s.startTime).getTime());
    const avgTimePerSession = sessionTimes.length > 0 ? sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length / 1000 : 0;

    const wireframeAnalytics = project.wireframes.map(wireframe => {
      // Se uma tela específica está selecionada E não estamos no modo global, só mostra os dados para essa tela
      if (displayMode === 'single_wireframe' && selectedWireframe && wireframe.id !== selectedWireframe) {
        return { name: wireframe.name, totalClicks: 0, correctClicks: 0, accuracy: 0, visitCount: 0 };
      }

      const wireframeClicks = sessionsForWireframeAnalytics.reduce((acc, session) => 
        acc + session.clicks.filter(c => c.wireframeId === wireframe.id).length, 0
      );
      const correctClicks = sessionsForWireframeAnalytics.reduce((acc, session) => 
        acc + session.clicks.filter(c => c.wireframeId === wireframe.id && c.correct).length, 0
      );
      const visitsOnWireframe = sessionsForWireframeAnalytics.filter(s => s.clicks.some(c => c.wireframeId === wireframe.id)).length;
      
      return { 
        name: wireframe.name, 
        totalClicks: wireframeClicks, 
        correctClicks, 
        accuracy: wireframeClicks > 0 ? (correctClicks / wireframeClicks) * 100 : 0, 
        visitCount: visitsOnWireframe 
      };
    });

    // Lógica para o clickHeatmap: Se for global_heatmap, pegue todos os cliques; caso contrário, filtre.
    const clickHeatmap = (displayMode === 'global_heatmap' || !selectedWireframe)
      ? allClicks.map(click => ({ ...click, intensity: 1 }))
      : sessionsForWireframeAnalytics.reduce((acc, session) => {
          session.clicks.filter(click => click.wireframeId === selectedWireframe)
            .forEach(click => acc.push({ ...click, intensity: 1 }));
          return acc;
        }, [] as any[]);

    return { totalSessions, completionRate, avgClicksPerSession, avgTimePerSession, wireframeAnalytics, clickHeatmap };
  }, [project, displayedSessions, selectedWireframe, displayMode]); // Adicionado displayMode como dependência

  const currentWireframe = project?.wireframes.find(w => w.id === selectedWireframe);
  const currentWireframeClicks = (displayMode === 'single_wireframe' && selectedWireframe)
    ? analytics.clickHeatmap.filter(c => c.wireframeId === selectedWireframe)
    : analytics.clickHeatmap; // Se global_heatmap ou nenhuma tela selecionada, use todos os cliques

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

  // Logs para depuração do mapa coletivo
  useEffect(() => {
    if (!selectedSessionId) { // Apenas na visão coletiva
      console.log('[Heatmap Debug] Relevant Sessions Length:', relevantSessions.length);
      console.log('[Heatmap Debug] Displayed Sessions Length (Collective):', displayedSessions.length);
      console.log('[Heatmap Debug] Click Heatmap Length (Aggregated):', analytics.clickHeatmap.length);
      console.log('[Heatmap Debug] Heatmap Clusters Length:', heatmapClusters.length);
      if (heatmapClusters.length > 0) {
        console.log('[Heatmap Debug] Example Cluster Intensity:', heatmapClusters[0].intensity);
      }
    }
  }, [selectedSessionId, relevantSessions, displayedSessions, analytics.clickHeatmap, heatmapClusters]);

  // Calcula a intensidade máxima para normalizar as cores
  const maxIntensity = useMemo(() => {
    if (heatmapClusters.length === 0) return 1;
    return Math.max(...heatmapClusters.map(c => c.intensity));
  }, [heatmapClusters]);

  // Função para obter a cor do mapa de calor com base na intensidade
  const getHeatmapColor = useCallback((intensity: number, maxInt: number) => {
    const normalized = maxInt > 0 ? intensity / maxInt : 0;
    const baseOpacity = 0.3; // Restaurado para a intensidade anterior
    const maxOpacity = 0.9; // Restaurado para a intensidade anterior
    const overallOpacity = baseOpacity + (normalized * (maxOpacity - baseOpacity)); // Opacidade geral para o núcleo

    return `radial-gradient(circle at center,
      rgba(255, 0, 0, ${overallOpacity}) 0%,      /* Vermelho */
      rgba(255, 128, 0, ${overallOpacity * 0.8}) 20%, /* Laranja */
      rgba(255, 255, 0, ${overallOpacity * 0.6}) 40%, /* Amarelo */
      rgba(0, 255, 0, ${overallOpacity * 0.4}) 60%,  /* Verde */
      rgba(0, 0, 255, ${overallOpacity * 0.2}) 80%,  /* Azul */
      transparent 100% /* Transparente na borda */
    )`;
  }, []);

  const exportReport = () => {
    // 1. Get user name from somewhere (placeholder for now)
    const responsibleProfessional = "Nome do Profissional"; // Placeholder

    // 2. Create a new jsPDF document
    const doc = new jsPDF();

    // 3. Add Header
    doc.setFontSize(18);
    doc.text("Relatório de Usabilidade", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    doc.text(`Responsável: ${responsibleProfessional}`, 20, 35);
    doc.line(20, 40, 190, 40); // Separator line

    // 4. Add Project Info
    doc.setFontSize(14);
    doc.text(`Projeto: ${project?.name}`, 20, 50);
    doc.setFontSize(11);
    let y = 60;
    if (project?.description) {
        const descriptionLines = doc.splitTextToSize(project.description, 170);
        doc.text(descriptionLines, 20, y);
        y += descriptionLines.length * 5 + 10; // Adjust y position after description
    }

    // 5. Add Analysis
    const wireframesToReport = selectedWireframe
        ? analytics.wireframeAnalytics.filter(w => w.name === project?.wireframes.find(wf => wf.id === selectedWireframe)?.name)
        : analytics.wireframeAnalytics;

    wireframesToReport.forEach(wireframeData => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.text(`Análise do Teste de Usabilidade da Tela: ${wireframeData.name}`, 20, y);
        y += 10;

        const totalClicks = wireframeData.totalClicks;
        const correctClicks = wireframeData.correctClicks;
        const accuracy = wireframeData.accuracy; // This is a percentage

        let performanceText = "";
        if (accuracy >= 90) {
            performanceText = "excelente";
        } else if (accuracy >= 70) {
            performanceText = "bom";
        } else if (accuracy >= 50) {
            performanceText = "mediano";
        } else {
            performanceText = "ruim";
        }

        const avgHits = wireframeData.visitCount > 0 ? (correctClicks / wireframeData.visitCount).toFixed(1) : "0";

        const paragraph = `A tela \"${wireframeData.name}\" obteve um total de ${totalClicks} cliques, dos quais ${correctClicks} foram corretos, resultando em uma taxa de acerto de ${accuracy.toFixed(1)}%. ` +
                        `Com ${wireframeData.visitCount} visitantes únicos, a média de acertos por visitante foi de ${avgHits}. ` +
                        `Este resultado indica um desempenho ${performanceText}.`;

        const paragraphLines = doc.splitTextToSize(paragraph, 170);
        doc.setFontSize(11);
        doc.text(paragraphLines, 20, y);
        y += paragraphLines.length * 5 + 10;
    });

    // 6. Save the PDF
    doc.save(`relatorio_${project?.name.replace(/\s/g, '_')}.pdf`);
  };

  if (sessionsLoading || loadingProjectTest) {
    return <div className="p-6 text-center">Carregando dados do dashboard...</div>;
  }

  if (sessionsError || projectTestError) {
    return <div className="p-6 text-center text-red-500">Erro ao carregar dashboard: {sessionsError || projectTestError}</div>;
  }
  
  if (!project || !project.resolution) {
    return <div className="p-6 text-center">Carregando dados do projeto...</div>;
  }

  if (relevantSessions.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2>Dashboard de Resultados - {project.name}</h2>
        <p className="text-muted-foreground mb-6">Nenhuma sessão de teste registrada para este projeto ainda.</p>
      </div>
    );
  }

  const layoutModifierClass = project.resolution === 'mobile' ? 'layout-mobile' : 'layout-desktop';

  const customCss = `
    .dashboard-grid-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    /* 1280px to 1600px: Side-by-side for mobile only */
    @media (min-width: 1280px) and (max-width: 1599.98px) {
        .dashboard-grid-container.layout-mobile {
            grid-template-columns: 3fr 2fr;
        }
    }

    /* >= 1600px: Always side-by-side */
    @media (min-width: 1600px) {
        .dashboard-grid-container.layout-mobile {
            grid-template-columns: 3fr 2fr;
        }
        .dashboard-grid-container.layout-desktop {
            grid-template-columns: 2fr 3fr;
        }
    }
  `;

  return (
    <>
      <style>{customCss}</style>
      <div className={`p-6 h-full dashboard-grid-container ${layoutModifierClass}`}>
        {/* Coluna de Análise */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>Dashboard - {project.name}</h2>
              <p className="text-muted-foreground">Análise de usabilidade e mapas de calor</p>
            </div>
            <Button onClick={exportReport}><Download className="w-4 h-4 mr-2" />Exportar relatório</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Sessões</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.totalSessions}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cliques Médios</CardTitle><MousePointer className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.avgClicksPerSession.toFixed(1)}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Médio</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(analytics.avgTimePerSession).toFixed(1)}s</div></CardContent></Card>
          </div>
          
          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="analytics">Análise por Tela</TabsTrigger>
              <TabsTrigger value="distribuicao-clique">Distribuição por Clique</TabsTrigger>
              <TabsTrigger value="analise-detalhada">Análise Detalhada</TabsTrigger>
              <TabsTrigger value="sessions">Sessões</TabsTrigger>
            </TabsList>
            <TabsContent value="analytics" className="space-y-4">
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
            </TabsContent>
            <TabsContent value="distribuicao-clique" className="space-y-4">
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
            </TabsContent>
            <TabsContent value="analise-detalhada" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Análise Detalhada</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.wireframeAnalytics.map((wireframe, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedWireframe === wireframe.id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedWireframe(wireframe.id)}
                      >
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
                <CardHeader><CardTitle className="text-lg">Sessões de Teste</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {relevantSessions.map((session) => {
                      const duration = session.endTime ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 : 0;
                      return (
                        <div 
                          key={session.id} 
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedSessionId === session.id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'}`}
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          <div>
                            <h4 className="font-medium">{session.userName}</h4>
                            <p className="text-sm text-muted-foreground">{new Date(session.startTime).toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="text-right">
                            <div><Badge variant={session.completed ? 'default' : 'secondary'}>{session.completed ? 'Concluído' : 'Incompleto'}</Badge></div>
                            <div className="text-sm text-muted-foreground mt-1">{session.clicks.length} cliques • {duration > 0 ? `${Math.round(duration)}s` : '-'}</div>
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
        
        {/* Coluna do Wireframe */}
        <div className="space-y-6">
          <Card className="sticky top-6 h-[calc(100vh-3rem)]">
            <CardHeader>
              <CardTitle className="text-lg">Mapa de Calor</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Button 
                  variant={displayMode === 'global_heatmap' ? 'default' : 'outline'}
                  size="sm" 
                  onClick={() => {
                    setDisplayMode('global_heatmap');
                    setSelectedWireframe(''); // Limpa a seleção de wireframe individual
                  }}
                >
                  Mapa Coletivo
                </Button>
                <Button 
                  variant={displayMode === 'single_wireframe' ? 'default' : 'outline'}
                  size="sm" 
                  onClick={() => setDisplayMode('single_wireframe')}
                >
                  Mapa por Tela
                </Button>
                {selectedSessionId && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedSessionId(null)}>
                    Ver Todas as Sessões
                  </Button>
                )}
                {displayMode === 'single_wireframe' && selectedWireframe && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedWireframe('')}> 
                    Ver Todas as Telas (individual)
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>{currentWireframeClicks.length} cliques</span>
                <span>•</span>
                <span>{heatmapClusters.length} clusters</span>
              </div>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              {displayMode === 'single_wireframe' && (
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
              )}
              
              <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                {displayMode === 'global_heatmap' ? (
                  <div
                    className="relative shadow-lg bg-white border-2 border-gray-300 overflow-hidden"
                    style={{
                      transform: `scale(${wireframeScale})`,
                      transformOrigin: 'top left',
                      width: getCanvasDimensions.width,
                      height: getCanvasDimensions.height,
                    }}
                  >
                    {/* Renderiza todos os wireframes em modo de overlay transparente */}
                    {project.wireframes.map(wf => (
                      <div
                        key={wf.id}
                        className="absolute inset-0"
                        style={{
                          // Ajusta a opacidade para que os wireframes sejam visíveis mas não interfiram com o heatmap
                          opacity: 0.1,
                          pointerEvents: 'none',
                        }}
                      >
                        {wf.elements.map(element => {
                          const bgColor = element.overrides?.backgroundColor || element.backgroundColor || 'transparent';
                          const text = element.overrides?.text || element.text;
                          const textColor = element.overrides?.textColor || element.textColor || '#000';
                          const textAlign = element.overrides?.textAlign || element.textAlign || 'left';
                          const borderColor = element.borderColor || '#ccc';
                          const borderWidth = element.borderWidth || 1;
                          const elementType = element.type;

                          if (elementType === 'image' && element.path) {
                            return (
                              <img
                                key={element.id}
                                src={element.path}
                                alt="Wireframe Element"
                                className="absolute object-cover"
                                style={{
                                  left: element.x, top: element.y, width: element.width, height: element.height,
                                  zIndex: 1
                                }}
                              />
                            );
                          }

                          return (
                            <div
                              key={element.id}
                              className={`absolute border ${elementType === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                              style={{
                                left: element.x, top: element.y, width: element.width, height: element.height,
                                backgroundColor: bgColor,
                                borderColor: borderColor,
                                borderWidth: borderWidth,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
                                textAlign: textAlign, 
                                zIndex: 1
                              }}
                            >
                              {text && <span className="select-none overflow-hidden text-xs p-1" style={{ color: textColor }}>{text}</span>}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Heatmap Clusters (para o mapa global) */}
                    {heatmapClusters.map((cluster) => {
                      const size = 30 + cluster.intensity * 15;
                      // Para o mapa de calor global, os cliques já estão normalizados ou tratados no currentWireframeClicks
                      // Não é necessário ajustar as coordenadas aqui, já que o currentWireframeClicks já é o agregado.
                      return (
                        <div
                          key={cluster.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: cluster.x - size / 2, 
                            top: cluster.y - size / 2,
                            width: size, 
                            height: size,
                            background: getHeatmapColor(cluster.intensity, maxIntensity),
                            filter: 'blur(12px)',
                            zIndex: 20,
                            borderRadius: `${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% / ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}%`,
                            transform: `scale(${1 + Math.random() * 0.2}) rotate(${Math.random() * 360}deg)`
                          }}
                        />
                      );
                    })}
                  </div>
                ) : currentWireframe ? (
                  <div 
                    className="relative shadow-lg bg-white border-2 border-gray-300 overflow-hidden" // Adicionado overflow-hidden
                    style={{
                      transform: `scale(${wireframeScale})`,
                      transformOrigin: 'top left',
                      width: getCanvasDimensions.width,
                      height: getCanvasDimensions.height
                    }}
                  >
                      {currentWireframe.elements.map((element) => {
                        // Não precisamos mais buscar um master componente, as propriedades estão diretamente no elemento
                        // const master = project.components?.find(c => c.id === element.componentId);
                        // console.log(`[Wireframe Element] ID: ${element.id}, Component ID: ${element.componentId}, Master Found: ${!!master}`);
                        // if (!master) return null;

                        const bgColor = element.overrides?.backgroundColor || element.backgroundColor || 'transparent';
                        const text = element.overrides?.text || element.text;
                        const textColor = element.overrides?.textColor || element.textColor || '#000';
                        const textAlign = element.overrides?.textAlign || element.textAlign || 'left';
                        const borderColor = element.borderColor || '#ccc';
                        const borderWidth = element.borderWidth || 1;
                        const elementType = element.type; // Usar o tipo do elemento diretamente

                        if (elementType === 'image' && element.path) {
                          return (
                            <img
                              key={element.id}
                              src={element.path} // Usar element.path diretamente
                              alt="Wireframe Element"
                              className="absolute object-cover"
                              style={{
                                left: element.x, top: element.y, width: element.width, height: element.height,
                                zIndex: 10 
                              }}
                            />
                          );
                        }
                        
                        // Renderização para outros tipos (botões, texto, retângulos, etc.)
                        return (
                          <div
                            key={element.id}
                            className={`absolute border ${elementType === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                            style={{
                              left: element.x, top: element.y, width: element.width, height: element.height,
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              borderWidth: borderWidth,
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
                              textAlign: textAlign, 
                              zIndex: 10
                            }}
                          >
                            {text && <span className="select-none overflow-hidden text-xs p-1" style={{ color: textColor }}>{text}</span>}
                          </div>
                        );
                      })}

                      {/* Heatmap Clusters (para o mapa por tela) */}
                      {heatmapClusters.map((cluster) => {
                        const size = 30 + cluster.intensity * 15;
                        return (
                          <div
                            key={cluster.id}
                            className="absolute pointer-events-none"
                            style={{
                              left: cluster.x - size / 2, 
                              top: cluster.y - size / 2,
                              width: size, 
                              height: size,
                              background: getHeatmapColor(cluster.intensity, maxIntensity), // Usando a nova função de cor
                              filter: 'blur(12px)', // Restaurado o blur para 12px
                              zIndex: 20, // Aumentado para garantir que fique sempre acima
                              borderRadius: `${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% / ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}% ${Math.random() * 50 + 25}%`, // Formas irregulares
                              transform: `scale(${1 + Math.random() * 0.2}) rotate(${Math.random() * 360}deg)` // Variação de tamanho e rotação
                            }}
                          />
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Selecione uma tela para ver o mapa de calor individual ou clique em "Mapa Coletivo" para ver o mapa global.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
