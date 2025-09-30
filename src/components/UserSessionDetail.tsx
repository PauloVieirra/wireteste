import React, { useState, useMemo, Suspense } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import { ArrowLeft, ArrowRight, X, MousePointer, Clock, Target, Users } from 'lucide-react';
import { iconIndex } from './icon-index';
import { Display, Star } from 'react-bootstrap-icons';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon';
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
  iconName?: string;
  iconComponent?: string;
  imageSrc?: string;
  videoSrc?: string;
  navigationTarget?: string;
  parentId?: string;
  name?: string;
  opacity?: number; // Adicionado para controlar a transparência da imagem
  // Advanced text properties
  fontWeight?: 'normal' | 'bold';
  fontFamily?: 'inter' | 'roboto' | 'arial' | 'helvetica' | 'times' | 'georgia' | 'monospace';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
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

interface UserSessionDetailProps {
  session: TestSession;
  project: Project;
  onClose: () => void;
}

const getFontSize = (element: WireframeElement, resolution: 'mobile' | 'tablet' | 'desktop') => {
  const fontSizes = {
    desktop: {
      h1: 40,  // 2.5rem
      h2: 32,  // 2rem
      h3: 28,  // 1.75rem
      h4: 24,  // 1.5rem
      h5: 20,  // 1.25rem
      h6: 16,  // 1rem
      p: 16    // 1rem
    },
    tablet: {
      h1: 32,  // 2rem
      h2: 28,  // 1.75rem
      h3: 24,  // 1.5rem
      h4: 20,  // 1.25rem
      h5: 18,  // 1.125rem
      h6: 16,  // 1rem
      p: 15    // 0.95rem
    },
    mobile: {
      h1: 28,  // 1.75rem
      h2: 24,  // 1.5rem
      h3: 20,  // 1.25rem
      h4: 18,  // 1.125rem
      h5: 16,  // 1rem
      h6: 14,  // 0.875rem
      p: 14    // 0.875rem
    }
  };

  const level = element.textLevel || 'p';
  return fontSizes[resolution][level] || fontSizes[resolution].p;
};

const getFontFamilyCSS = (font: string) => {
  switch (font) {
    case 'inter': return '"Inter", system-ui, sans-serif';
    case 'roboto': return '"Roboto", system-ui, sans-serif';
    case 'arial': return 'Arial, sans-serif';
    case 'helvetica': return '"Helvetica Neue", Helvetica, sans-serif';
    case 'times': return '"Times New Roman", Times, serif';
    case 'georgia': return 'Georgia, serif';
    case 'monospace': return '"Fira Code", "Consolas", monospace';
    default: return '"Inter", system-ui, sans-serif';
  }
};

const imageplaceholder = "https://images.unsplash.com/photo-1714578187196-29775454aa39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxwbGFjZWhvbGRlciUyMGltYWdlfGVufDF8fHx8MTc1NzgwOTUzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const videoplaceholder = "https://images.unsplash.com/photo-1642726197561-ef7224c054a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx2aWRlbyUyMHBsYXllciUyMHRodW1ibmFpbHxlbnwxfHx8fDE3NTc3NjA2Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export function UserSessionDetail({ session, project, onClose }: UserSessionDetailProps) {
  console.log('UserSessionDetail component entered');
  const [currentWireframeIndex, setCurrentWireframeIndex] = useState(0);

  const wireframesInSession = useMemo(() => {
    const uniqueWireframeIds = Array.from(new Set(session.clicks.map(click => click.wireframeId)));
    return project.wireframes.filter(wf => uniqueWireframeIds.includes(wf.id));
  }, [session.clicks, project.wireframes]);

  const currentWireframe = wireframesInSession[currentWireframeIndex];
  const clicksForCurrentWireframe = session.clicks.filter(click => click.wireframeId === currentWireframe?.id);
  console.log('Clicks for current wireframe:', clicksForCurrentWireframe);

  const getCanvasDimensions = () => {
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 375, height: 812 };
    }
  };

  const canvasDimensions = getCanvasDimensions();
  const zoom = 0.6; // Adjust zoom for display within the modal

  const createHeatmapClusters = (clicks: Click[]) => {
    const clusters: any[] = [];
    const clusterRadius = 40; // pixels
    
    clicks.forEach(click => {
      const existingCluster = clusters.find(cluster => {
        const distance = Math.sqrt(
          Math.pow(cluster.x - click.x, 2) + Math.pow(cluster.y - click.y, 2)
        );
        return distance <= clusterRadius;
      });
      
      if (existingCluster) {
        existingCluster.intensity += 1;
        existingCluster.correct = existingCluster.correct || click.correct;
        existingCluster.x = (existingCluster.x * (existingCluster.intensity - 1) + click.x) / existingCluster.intensity;
        existingCluster.y = (existingCluster.y * (existingCluster.intensity - 1) + click.y) / existingCluster.intensity;
      } else {
        clusters.push({
          x: click.x,
          y: click.y,
          intensity: 1,
          correct: click.correct,
          id: `cluster-${clusters.length}`
        });
      }
    });
    
    return clusters;
  };

  const heatmapClusters = useMemo(() => createHeatmapClusters(clicksForCurrentWireframe), [clicksForCurrentWireframe]);
  console.log('Heatmap clusters:', heatmapClusters);

  const handleNextWireframe = () => {
    setCurrentWireframeIndex(prev => Math.min(prev + 1, wireframesInSession.length - 1));
  };

  const handlePrevWireframe = () => {
    setCurrentWireframeIndex(prev => Math.max(prev - 1, 0));
  };

  const renderIcon = (element: WireframeElement) => {
    if (element.iconComponent) {
      const IconComponent = iconIndex[element.iconComponent];
      if (IconComponent) {
        return (
          <Suspense fallback={<div>...</div>}>
            <IconComponent
              style={{
                fontSize: Math.min(element.width, element.height) * 0.6,
                color: element.textColor || 'var(--foreground)',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Suspense>
        );
      }
    }
    return <Star className="w-full h-full" style={{ color: element.textColor || 'var(--foreground)' }} />;
  };

  const renderElement = (element: WireframeElement) => {
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x * zoom,
      top: element.y * zoom,
      width: element.width * zoom,
      height: element.height * zoom,
      backgroundColor: element.backgroundColor || 'transparent',
      border: element.borderWidth ? `${element.borderWidth * zoom}px solid ${element.borderColor || '#d1d5db'}` : 'none',
      borderRadius: element.type === 'circle' ? '50%' : undefined,
      zIndex: element.zIndex || 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.textAlign || 'center',
      fontSize: getFontSize(element, project.resolution) * zoom,
      color: element.textColor || 'var(--foreground)',
      textAlign: element.textAlign || 'center',
      overflow: 'hidden',
      userSelect: 'none',
    };

    let content = null;
    
    switch (element.type) {
      case 'text':
      case 'button':
        content = element.text || (element.type === 'button' ? 'Button' : 'Text');
        break;
      case 'image':
        content = (
          <img 
            src={element.imageSrc || imageplaceholder} 
            alt="Imagem"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        );
        break;
      case 'video':
        content = (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video className="w-8 h-8 text-white" />
          </div>
        );
        break;
      case 'icon':
        content = renderIcon(element);
        break;
      case 'line':
        elementStyle.backgroundColor = element.textColor || 'var(--foreground)';
        break;
      case 'rectangle':
      case 'circle':
      default:
        break;
    }

    return (
      <div
        key={element.id}
        style={elementStyle}
      >
        {content}
      </div>
    );
  };

  const duration = session.endTime 
    ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
    : 0;

  const correctClicksCount = session.clicks.filter(c => c.correct).length;
  const totalClicksCount = session.clicks.length;
  const accuracy = totalClicksCount > 0 ? (correctClicksCount / totalClicksCount) * 100 : 0;

  return (
    <div className="w-full h-screen bg-background">
      <div className="w-full h-full flex flex-col">
        <div className="flex flex-col space-y-1.5 border-b p-4 text-center sm:text-left flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Detalhes da Sessão: {session.userName}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Dashboard */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Informações da Sessão</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Usuário</p>
                  <p className="text-muted-foreground text-sm">{session.userName} ({session.userEmail})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duração</p>
                  <p className="text-muted-foreground text-sm">{duration > 0 ? `${Math.round(duration)} segundos` : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MousePointer className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cliques Registrados</p>
                  <p className="text-muted-foreground text-sm">{totalClicksCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Precisão</p>
                  <p className="text-muted-foreground text-sm">{accuracy.toFixed(1)}% ({correctClicksCount} corretos)</p>
                </div>
              </div>
            </div>

            {currentWireframe && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-4">Informações da Tela Atual</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tela</p>
                      <p className="text-muted-foreground text-sm">{currentWireframe.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cliques nesta tela</p>
                      <p className="text-muted-foreground text-sm">{clicksForCurrentWireframe.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Precisão nesta tela</p>
                      <p className="text-muted-foreground text-sm">
                        {clicksForCurrentWireframe.length > 0 
                          ? ((clicksForCurrentWireframe.filter(c => c.correct).length / clicksForCurrentWireframe.length) * 100).toFixed(1) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <h3 className="text-lg font-semibold mt-6 mb-4">Navegação da Sessão</h3>
            <div className="space-y-2">
              {wireframesInSession.map((wf, index) => (
                <div 
                  key={wf.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentWireframeIndex === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentWireframeIndex(index)}
                >
                  <span className="font-medium">{wf.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({session.clicks.filter(c => c.wireframeId === wf.id).length} cliques)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Heatmap View */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20 relative">
            {currentWireframe ? (
              <>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                  <h4 className="text-lg font-semibold">{currentWireframe.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {clicksForCurrentWireframe.length} cliques nesta tela
                  </p>
                </div>

                <div
                  className="bg-white border-2 border-gray-300 relative shadow-lg overflow-hidden"
                  style={{
                    width: canvasDimensions.width * zoom,
                    height: canvasDimensions.height * zoom,
                  }}
                >
                  {/* Wireframe Elements */}
                  {currentWireframe.elements
                    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                    .map(renderElement)}

                  {/* Clustered Heatmap Points */}
                  {heatmapClusters.map((cluster, index) => {
                    const intensityMultiplier = Math.min(cluster.intensity * 0.3 + 0.7, 2.5); 
                    const baseSize = 50; 
                    const randomVariation = Math.sin(index * 2.3) * 0.3 + 1; 
                    const size = baseSize * intensityMultiplier * randomVariation * zoom;
                    
                    const alphaMultiplier = Math.min(cluster.intensity * 0.2 + 0.4, 1);
                    
                    return (
                      <div
                        key={cluster.id}
                        className="absolute pointer-events-none"
                        style={{
                          left: cluster.x * zoom - size / 2,
                          top: cluster.y * zoom - size / 2,
                          width: size,
                          height: size,
                          background: cluster.correct 
                            ? `radial-gradient(ellipse ${85 + Math.sin(index * 2.1) * 15}% ${90 + Math.cos(index * 1.7) * 10}% at ${45 + Math.sin(index * 3.2) * 10}% ${50 + Math.cos(index * 2.8) * 15}%, 
                                rgba(220, 38, 127, ${0.8 * alphaMultiplier}) 0%,     
                                rgba(255, 85, 85, ${0.65 * alphaMultiplier}) 20%,     
                                rgba(255, 165, 0, ${0.45 * alphaMultiplier}) 40%,     
                                rgba(255, 255, 0, ${0.25 * alphaMultiplier}) 65%,     
                                rgba(124, 252, 0, ${0.12 * alphaMultiplier}) 80%,     
                                rgba(50, 205, 50, ${0.05 * alphaMultiplier}) 90%,     
                                transparent 100%                                       
                              )`
                            : `radial-gradient(ellipse ${80 + Math.sin(index * 1.9) * 20}% ${95 + Math.cos(index * 2.3) * 15}% at ${50 + Math.sin(index * 2.7) * 15}% ${45 + Math.cos(index * 1.4) * 12}%, 
                                rgba(220, 38, 38, ${0.75 * alphaMultiplier}) 0%,      
                                rgba(255, 99, 71, ${0.55 * alphaMultiplier}) 25%,     
                                rgba(255, 165, 0, ${0.35 * alphaMultiplier}) 50%,     
                                rgba(255, 255, 0, ${0.2 * alphaMultiplier}) 70%,     
                                rgba(173, 255, 47, ${0.08 * alphaMultiplier}) 85%,    
                                transparent 100%                                       
                              )`,
                          borderRadius: `${35 + Math.sin(index * 1.7) * 25}% ${65 + Math.cos(index * 2.1) * 20}% ${40 + Math.sin(index * 1.3) * 30}% ${60 + Math.cos(index * 1.9) * 15}%`,
                          transform: `rotate(${index * 37}deg) scale(${0.7 + Math.sin(index * 1.5) * 0.5}) skew(${Math.sin(index * 2.2) * 8}deg, ${Math.cos(index * 1.8) * 6}deg)`,
                          filter: 'blur(1.5px)',
                          mixBlendMode: 'multiply',
                          zIndex: 10 + cluster.intensity
                        }}
                        title={`${cluster.intensity} clique${cluster.intensity > 1 ? 's' : ''} ${cluster.correct ? 'correto' : 'incorreto'}${cluster.intensity > 1 ? 's' : ''} nesta área`}
                      />
                    );
                  })}
                </div>

                {/* Navigation Arrows */}
                {wireframesInSession.length > 1 && (
                  <div className=" flex gap-2 " style={{margin:'32px', width:"200px", justifyContent:'space-between'}}>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handlePrevWireframe} 
                      disabled={currentWireframeIndex === 0}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleNextWireframe} 
                      disabled={currentWireframeIndex === wireframesInSession.length - 1}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum wireframe para exibir.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}