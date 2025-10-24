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
  Cell,
  Legend
} from 'recharts';
import { 
  Download, 
  Users, 
  MousePointer, 
  Target, 
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useLoading } from './GlobalLoading'; // Importar useLoading
import { WireframeCanvas } from './WireframeCanvas';
import type { Project, TestSession, WireframeElement } from '../types';
import { getTestsByProjectId, supabase } from '../utils/supabase/supabaseClient';

// --- DATA STRUCTURES ---

interface WireframeHeatmapDashboardProps {
  project: Project;
  sessions: TestSession[];
}

const getFontSize = (element: WireframeElement, resolution: 'mobile' | 'tablet' | 'desktop') => {
  if (element.fontSize) {
    return element.fontSize;
  }
  const fontSizes = {
    desktop: { h1: 40, h2: 32, h3: 28, h4: 24, h5: 20, h6: 16, p: 16 },
    tablet:  { h1: 32, h2: 28, h3: 24, h4: 20, h5: 18, h6: 16, p: 15 },
    mobile:  { h1: 28, h2: 24, h3: 20, h4: 18, h5: 16, h6: 14, p: 14 }
  };
  const res = resolution || 'mobile';
  const level = element.textLevel || 'p';
  return fontSizes[res][level] || fontSizes[res].p;
};

export function WireframeHeatmapDashboard({ project, sessions }: WireframeHeatmapDashboardProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null); // Novo estado para sessão individual
  const [viewMode, setViewMode] = useState<'manual' | 'ai'>('manual');
  const [aiSessions, setAiSessions] = useState<TestSession[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframeScale, setWireframeScale] = useState(1);
  const { showLoading, hideLoading } = useLoading(); // Usar o hook de loading
  
  const [selectedWireframe, setSelectedWireframe] = useState(''); // Estado para a tela selecionada

  useEffect(() => {
    if (project && project.wireframes.length > 0 && !selectedWireframe) {
      setSelectedWireframe(project.wireframes[0].id);
    }
  }, [project, selectedWireframe]);

  const getCanvasDimensions = useMemo(() => {
    if (!project) return { width: 375, height: 812 };
    const wireframe = project.wireframes.find(w => w.id === selectedWireframe);
    if (wireframe && wireframe.width && wireframe.height) {
      return { width: wireframe.width, height: wireframe.height };
    }
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1920, height: 1080 };
      default: return { width: 1920, height: 1080 };
    }
  }, [project, selectedWireframe]);

  useEffect(() => {
    const fetchAiSessions = async () => {
      if (!project) return;
      showLoading();
      try {
        // First, get the tests associated with the project
        const tests = await getTestsByProjectId(project.id);
        const testIds = tests.map(t => t.id);

        if (testIds.length === 0) {
          setAiSessions([]);
          hideLoading();
          return;
        }

        // Then, fetch the AI sessions for those tests
        const { data, error } = await supabase
          .from('manus_ai_test_sessions')
          .select('*')
          .in('test_id', testIds);

        if (error) {
          throw error;
        }
        setAiSessions(data as TestSession[]);
      } catch (error) {
        console.error('Error fetching AI test sessions:', error);
        setAiSessions([]);
      } finally {
        hideLoading();
      }
    };

    fetchAiSessions();
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

  const relevantSessions = viewMode === 'manual' ? sessions : aiSessions;

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

    const sessionsForWireframeAnalytics = displayedSessions;

    const totalSessions = sessionsForWireframeAnalytics.length;
    const completedSessions = sessionsForWireframeAnalytics.filter(s => s.completed).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const totalClicksOnDisplayedWireframes = allClicks.length;

    const avgClicksPerSession = totalSessions > 0 ? totalClicksOnDisplayedWireframes / totalSessions : 0;

    const sessionTimes = sessionsForWireframeAnalytics.filter(s => s.endTime).map(s => new Date(s.endTime!).getTime() - new Date(s.startTime).getTime());
    const avgTimePerSession = sessionTimes.length > 0 ? sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length / 1000 : 0;

    const wireframeAnalytics = project.wireframes.map(wireframe => {
      const wireframeClicks = sessionsForWireframeAnalytics.reduce((acc, session) => 
        acc + session.clicks.filter(c => c.wireframeId === wireframe.id).length, 0
      );
      const correctClicks = sessionsForWireframeAnalytics.reduce((acc, session) => 
        acc + session.clicks.filter(c => c.wireframeId === wireframe.id && c.correct).length, 0
      );
      const visitsOnWireframe = new Set(
        sessionsForWireframeAnalytics
          .filter(s => s.percent && s.percent.some(p => p.screen === wireframe.id))
          .map(s => s.id)
      ).size;

      const totalTimeOnWireframe = sessionsForWireframeAnalytics.reduce((acc, session) => {
        const timeEntry = session.percent?.find(p => p.screen === wireframe.id);
        return acc + (timeEntry?.time || 0);
      }, 0);

      const avgTimeOnWireframe = visitsOnWireframe > 0 ? (totalTimeOnWireframe / visitsOnWireframe) / 1000 : 0;

      return { 
        name: wireframe.name, 
        totalClicks: wireframeClicks, 
        correctClicks,
        accuracy: wireframeClicks > 0 ? (correctClicks / wireframeClicks) * 100 : 0, 
        visitCount: visitsOnWireframe, 
        avgTime: avgTimeOnWireframe
      };
    });

    const clickHeatmap = !selectedWireframe
      ? []
      : sessionsForWireframeAnalytics.reduce((acc, session) => {
          session.clicks.filter(click => click.wireframeId === selectedWireframe)
            .forEach(click => acc.push({ ...click, intensity: 1 }));
          return acc;
        }, [] as any[]);

    return { totalSessions, completionRate, avgClicksPerSession, avgTimePerSession, wireframeAnalytics, clickHeatmap };
  }, [project, displayedSessions, selectedWireframe]);

  const currentWireframe = project?.wireframes.find(w => w.id === selectedWireframe);
  const currentWireframeClicks = analytics.clickHeatmap;

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

  const heatmapClusters = useMemo(() => createHeatmapClusters(currentWireframeClicks), [currentWireframeClicks]);

  useEffect(() => {
    if (!selectedSessionId) {
      console.log('[Heatmap Debug] Relevant Sessions Length:', relevantSessions.length);
      console.log('[Heatmap Debug] Displayed Sessions Length (Collective):', displayedSessions.length);
      console.log('[Heatmap Debug] Click Heatmap Length (Aggregated):', analytics.clickHeatmap.length);
      console.log('[Heatmap Debug] Heatmap Clusters Length:', heatmapClusters.length);
      if (heatmapClusters.length > 0) {
        console.log('[Heatmap Debug] Example Cluster Intensity:', heatmapClusters[0].intensity);
      }
    }
  }, [selectedSessionId, relevantSessions, displayedSessions, analytics.clickHeatmap, heatmapClusters]);

  const maxIntensity = useMemo(() => {
    if (heatmapClusters.length === 0) return 1;
    return Math.max(...heatmapClusters.map(c => c.intensity));
  }, [heatmapClusters]);

  const getHeatmapColor = useCallback((intensity: number, maxInt: number) => {
    const normalized = maxInt > 0 ? intensity / maxInt : 0;
    const baseOpacity = 0.3;
    const maxOpacity = 0.9;
    const overallOpacity = baseOpacity + (normalized * (maxOpacity - baseOpacity));

    return `radial-gradient(circle at center,
      rgba(255, 0, 0, ${overallOpacity}) 0%,
      rgba(255, 128, 0, ${overallOpacity * 0.8}) 20%,
      rgba(255, 255, 0, ${overallOpacity * 0.6}) 40%,
      rgba(0, 255, 0, ${overallOpacity * 0.4}) 60%,
      rgba(0, 0, 255, ${overallOpacity * 0.2}) 80%,
      transparent 100%
    )`;
  }, []);

  const exportReport = () => {
    const responsibleProfessional = "Nome do Profissional";
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Usabilidade", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    doc.text(`Responsável: ${responsibleProfessional}`, 20, 35);
    doc.line(20, 40, 190, 40);
    doc.setFontSize(14);
    doc.text(`Projeto: ${project?.name}`, 20, 50);
    doc.setFontSize(11);
    let y = 60;
    if (project?.description) {
        const descriptionLines = doc.splitTextToSize(project.description, 170);
        doc.text(descriptionLines, 20, y);
        y += descriptionLines.length * 5 + 10;
    }

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
        const accuracy = wireframeData.accuracy;

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

        const paragraph = `A tela "${wireframeData.name}" obteve um total de ${totalClicks} cliques, dos quais ${correctClicks} foram corretos, resultando em uma taxa de acerto de ${accuracy.toFixed(1)}%. ` +
                        `Com ${wireframeData.visitCount} visitantes únicos, a média de acertos por visitante foi de ${avgHits}. ` +
                        `Este resultado indica um desempenho ${performanceText}.`;

        const paragraphLines = doc.splitTextToSize(paragraph, 170);
        doc.setFontSize(11);
        doc.text(paragraphLines, 20, y);
        y += paragraphLines.length * 5 + 10;
    });

    doc.save(`relatorio_${project?.name.replace(/\s/g, '_')}.pdf`);
  };

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

    @media (min-width: 1280px) and (max-width: 1599.98px) {
        .dashboard-grid-container.layout-mobile {
            grid-template-columns: 3fr 2fr;
        }
    }

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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
              <p className="text-muted-foreground">
                {viewMode === 'manual' 
                  ? 'Análise de usabilidade e mapas de calor' 
                  : 'Análise de IA e mapas de calor'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {aiSessions.length > 0 && (
                <Button variant="outline" onClick={() => setViewMode(viewMode === 'manual' ? 'ai' : 'manual')}> 
                  {viewMode === 'manual' ? 'Ver Análise AI' : 'Ver Testes Manuais'}
                </Button>
              )}
              <Button onClick={exportReport}><Download className="w-4 h-4 mr-2" />Exportar relatório</Button>
            </div>
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
                  <CardHeader><CardTitle className="text-lg">Performance por Tela (Cliques)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.wireframeAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalClicks" fill="#8884d8" name="Total de Cliques" />
                        <Bar yAxisId="right" dataKey="accuracy" fill="#82ca9d" name="Precisão (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Tempo Médio por Tela (Segundos)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.wireframeAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}s`} />
                        <Legend />
                        <Bar dataKey="avgTime" fill="#ffc658" name="Tempo Médio (s)" />
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
        
        <div className="space-y-6">
          <Card className="sticky top-6 h-[calc(100vh-3rem)]">
            <CardHeader>
              <CardTitle className="text-lg">Mapa de Calor</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {selectedSessionId && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedSessionId(null)}>
                    Ver Todas as Sessões
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
              
              <div ref={containerRef} className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden p-4">
                <div
                  className="relative"
                  style={{
                    width: getCanvasDimensions.width * wireframeScale,
                    height: getCanvasDimensions.height * wireframeScale,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 shadow-lg bg-white overflow-hidden"
                    style={{
                      width: getCanvasDimensions.width,
                      height: getCanvasDimensions.height,
                      transform: `scale(${wireframeScale})`,
                      transformOrigin: 'top left',
                      
                    }}
                  >
                    {currentWireframe ? (
                      <WireframeCanvas
                        project={project}
                        wireframe={currentWireframe}
                        isReadOnly={true}
                        canvasDimensions={getCanvasDimensions}
                        getFontSize={getFontSize}
                        zoom={1}
                        selectedElementId={null}
                        onSelectElement={() => {}}
                        onUpdateElement={() => {}}
                        onElementDragEnd={() => {}}
                        onElementTransformEnd={() => {}}
                        getFontFamilyCSS={() => 'Inter'}
                        getElementMinimumSize={() => 5}
                        onCanvasMouseDown={() => {}}
                      />
                    ) : null}

                    {/* Heatmap Overlay */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
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
                              background: getHeatmapColor(cluster.intensity, maxIntensity),
                              filter: 'blur(12px)',
                              zIndex: 20,
                              borderRadius: '50%',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {!currentWireframe && (
                     <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                       <p>Selecione uma tela para ver o mapa de calor.</p>
                     </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}