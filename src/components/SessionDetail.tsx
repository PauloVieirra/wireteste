import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, Clock, MousePointer, CheckCircle, XCircle } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { WireframeCanvas } from './WireframeCanvas'; // Import the new canvas component

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
    textLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    iconName?: string;
    iconComponent?: string;
    imageSrc?: string;
    videoSrc?: string;
    fills?: any[];
    strokes?: any[];
    backgroundColor?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderWidth?: number;
    borderColor?: string;
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
  components: MasterComponent[];
}

interface Hotspot {
  id: string;
  wireframeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetWireframeId: string;
}

interface Test {
  id: string;
  hotspots: Hotspot[];
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
  userName: string;
  userEmail: string;
  clicks: Click[];
  startTime: string;
  endTime?: string;
  completed: boolean;
}

interface SessionDetailProps {
  session: TestSession;
  project: Project;
  test: Test;
}

const createHeatmapClusters = (clicks: Click[]) => {
    const clusters: any[] = [];
    const clusterRadius = 40;
    
    clicks.forEach(click => {
      const existingCluster = clusters.find(cluster => {
        const distance = Math.sqrt(Math.pow(cluster.x - click.x, 2) + Math.pow(cluster.y - click.y, 2));
        return distance <= clusterRadius;
      });
      
      if (existingCluster) {
        existingCluster.intensity += 1;
        existingCluster.x = (existingCluster.x * (existingCluster.intensity - 1) + click.x) / existingCluster.intensity;
        existingCluster.y = (existingCluster.y * (existingCluster.intensity - 1) + click.y) / existingCluster.intensity;
      } else {
        clusters.push({ x: click.x, y: click.y, intensity: 1, id: `cluster-${clusters.length}`, correct: click.correct });
      }
    });
    return clusters;
};

export function SessionDetail({ session, project, test }: SessionDetailProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [zoom] = useState(0.5);

  const sessionDuration = useMemo(() => {
    if (!session.endTime) return 0;
    return (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000;
  }, [session]);

  const accuracy = useMemo(() => {
    if (session.clicks.length === 0) return 0;
    const correctClicks = session.clicks.filter(c => c.correct).length;
    return (correctClicks / session.clicks.length) * 100;
  }, [session.clicks]);

  const visitedWireframes = useMemo(() => {
    const wireframeIds = [...new Set(session.clicks.map(c => c.wireframeId))];
    return project.wireframes.filter(w => wireframeIds.includes(w.id));
  }, [session.clicks, project.wireframes]);

  return (
    <div className="flex h-full">
      {/* Left Column: Session Data */}
      <div className="w-1/4 p-6 space-y-6 overflow-y-auto border-r">
        <Card>
          <CardHeader><CardTitle>Detalhes da Sessão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{session.userName}</p>
              <p className="text-sm text-muted-foreground">{session.userEmail}</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={session.completed ? 'default' : 'secondary'}>
                {session.completed ? 'Concluído' : 'Incompleto'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Métricas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2"><Clock className="w-6 h-6 text-muted-foreground" /><div><p className="text-lg font-bold">{sessionDuration.toFixed(1)}s</p><p className="text-xs text-muted-foreground">Duração</p></div></div>
            <div className="flex items-center gap-2"><MousePointer className="w-6 h-6 text-muted-foreground" /><div><p className="text-lg font-bold">{session.clicks.length}</p><p className="text-xs text-muted-foreground">Total de Cliques</p></div></div>
            <div className="flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-500" /><div><p className="text-lg font-bold">{session.clicks.filter(c => c.correct).length}</p><p className="text-xs text-muted-foreground">Cliques Corretos</p></div></div>
            <div className="flex items-center gap-2"><XCircle className="w-6 h-6 text-red-500" /><div><p className="text-lg font-bold">{session.clicks.filter(c => !c.correct).length}</p><p className="text-xs text-muted-foreground">Cliques Incorretos</p></div></div>
          </CardContent>
        </Card>

         <Card>
            <CardHeader><CardTitle>Precisão Geral</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-center">{accuracy.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      {/* Right Column: Heatmap Carousel */}
      <div className="w-3/4 p-6 flex flex-col items-center justify-center bg-gray-50">
        <div className="overflow-hidden w-full" ref={emblaRef}>
          <div className="flex">
            {visitedWireframes.map(wireframe => {
              const wireframeClicks = session.clicks.filter(c => c.wireframeId === wireframe.id);
              const heatmapClusters = createHeatmapClusters(wireframeClicks);
              const hotspots = test.hotspots.filter(h => h.wireframeId === wireframe.id);

              return (
                <div className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center p-4" key={wireframe.id}>
                  <h3 className="text-lg font-semibold mb-4">{wireframe.name}</h3>
                  <WireframeCanvas
                    project={project}
                    wireframe={wireframe}
                    zoom={zoom}
                    heatmapClusters={heatmapClusters}
                    hotspots={hotspots}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {visitedWireframes.length > 1 && (
            <div className="flex items-center gap-4 mt-4">
              <Button variant="outline" onClick={() => emblaApi?.scrollPrev()}><ArrowLeft className="w-4 h-4 mr-2" />Anterior</Button>
              <Button variant="outline" onClick={() => emblaApi?.scrollNext()}>Próximo<ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
        )}
      </div>
    </div>
  );
}