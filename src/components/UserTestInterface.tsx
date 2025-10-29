import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { PartyPopper, ArrowRight, X } from 'lucide-react';
import { WireframeCanvas } from './WireframeCanvas';
import Konva from 'konva';
import { useLoading } from './GlobalLoading';

interface WireframeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'button' | 'text' | 'line' | 'image' | 'video' | 'icon' | 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  backgroundColor?: string;
  textLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  fontSize?: number;
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
  opacity?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
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

interface Test {
  id: string;
  projectId?: string;
  name: string;
  objective?: string;
  type: 'wireframe' | 'mapa_calor' | 'pesquisa';
  perguntas?: any[];
  descricao?: string;
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
  percent?: { screen: string, time: number }[];
}

interface UserTestInterfaceProps {
  test: Test;
  project?: Project | null;
  onFinishTest: (session: TestSession) => void;
  onCancel: () => void;
  onReject: () => void; // Nova prop para rejeitar o teste
  isDemoMode?: boolean;
}

type TestPhase = 'intro' | 'consent' | 'testing' | 'disqualified';

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

export function UserTestInterface({ test, project, onFinishTest, onCancel, onReject, isDemoMode = false }: UserTestInterfaceProps) {
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [currentWireframeId, setCurrentWireframeId] = useState(project?.wireframes?.[0]?.id || '');
  const [clicks, setClicks] = useState<Click[]>([]);
  const [startTime] = useState(new Date().toISOString());
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const { showLoading, hideLoading } = useLoading();

  const [timePerWireframe, setTimePerWireframe] = useState<{ [key: string]: number }>({});
  const [currentScreenStartTime, setCurrentScreenStartTime] = useState<number>(0);
  const previousWireframeIdRef = useRef<string | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const zoom = 1;

  useEffect(() => {
    if (phase === 'testing') {
      setCurrentScreenStartTime(Date.now());
      previousWireframeIdRef.current = project?.wireframes?.[0]?.id || null;
    }
  }, [phase, project]);

  useEffect(() => {
    if (phase === 'testing' && previousWireframeIdRef.current && previousWireframeIdRef.current !== currentWireframeId) {
      const timeSpent = Date.now() - currentScreenStartTime;
      const prevId = previousWireframeIdRef.current;
      setTimePerWireframe(prev => ({
        ...prev,
        [prevId]: (prev[prevId] || 0) + timeSpent
      }));
      setCurrentScreenStartTime(Date.now());
    }
    previousWireframeIdRef.current = currentWireframeId;
  }, [currentWireframeId, phase, currentScreenStartTime]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSimNaoChange = (question: any, answer: 'sim' | 'nao') => {
    if (question.eliminatoria && answer !== question.resposta_esperada) {
      setPhase('disqualified');
    }
  };

  const handleMultiChoiceChange = (questionId: string, optionId: string, checked: boolean) => {
    const currentAnswers = answers[questionId] || [];
    if (checked) {
      handleAnswerChange(questionId, [...currentAnswers, optionId]);
    } else {
      handleAnswerChange(questionId, currentAnswers.filter((id: string) => id !== optionId));
    }
  };

  const handleCompleteSurvey = () => {
    const session: TestSession = {
      id: uuidv4(),
      testId: test.id,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      clicks: [],
      answers: answers,
      startTime: startTime,
      endTime: new Date().toISOString(),
      completed: true
    };
    onFinishTest(session);
  };

  if (phase === 'testing' && test.type === 'pesquisa') {
    const questions = test.perguntas || [];

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white shadow-lg rounded-lg">
            <CardHeader className="text-center p-8 border-b">
              <CardTitle className="text-3xl font-bold text-gray-800">{test.name}</CardTitle>
              <CardDescription className="mt-2 text-lg text-gray-600">{test.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {questions.length > 0 ? (
                questions.map((question, index) => (
                  <div key={question.id} className="border-t pt-6">
                    <Label className="text-xl font-semibold text-gray-700">Questão {index + 1}</Label>
                    <p className="text-lg mt-2 mb-6 text-gray-800">{question.texto}</p>
                    <div className="space-y-4">
                      {question.tipo === 'aberta' && (
                        <Textarea
                          placeholder="Sua resposta..."
                          className="min-h-[120px] text-base"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                      )}
                      {question.tipo === 'fechada' && question.options?.map((option: any) => (
                        <div key={option.id} className="flex items-center space-x-3 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                          <Checkbox
                            id={`option-${option.id}`}
                            checked={answers[question.id]?.includes(option.id) || false}
                            onCheckedChange={(checked) => handleMultiChoiceChange(question.id, option.id, !!checked)}
                          />
                          <Label htmlFor={`option-${option.id}`} className="text-base text-gray-700 cursor-pointer">{option.texto}</Label>
                        </div>
                      ))}
                      {question.tipo === 'sim_nao' && (
                        <div className="flex space-x-4">
                          <Button
                            variant={answers[question.id] === 'sim' ? 'default' : 'outline'}
                            onClick={() => handleSimNaoChange(question, 'sim')}
                            className="flex-1 text-lg py-6"
                          >
                            Sim
                          </Button>
                          <Button
                            variant={answers[question.id] === 'nao' ? 'destructive' : 'outline'}
                            onClick={() => handleSimNaoChange(question, 'nao')}
                            className="flex-1 text-lg py-6"
                          >
                            Não
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Desculpe, esta pesquisa ainda não possui perguntas.</p>
                  <Button onClick={onCancel} variant="outline">Voltar</Button>
                </div>
              )}
              <div className="flex justify-end mt-12 border-t pt-8">
                <Button onClick={handleCompleteSurvey} size="lg" className="text-xl py-7 px-10">Finalizar Pesquisa</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (test.type !== 'pesquisa' && !project) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div>
                <h1 className="text-2xl font-bold">Erro</h1>
                <p className="text-muted-foreground">
                    Ocorreu um erro ao carregar os dados do teste. Por favor, tente novamente mais tarde.
                </p>
            </div>
        </div>
    )
  }

  const getCanvasDimensions = () => {
    if (!project) return { width: 0, height: 0 };
    const wireframe = project.wireframes.find(w => w.id === currentWireframeId);
    if (wireframe && wireframe.width && wireframe.height) {
      return { width: wireframe.width, height: wireframe.height };
    }
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1920, height: 1080 };
      default: return { width: 1920, height: 1080 };
    }
  };

  const currentWireframe = project?.wireframes?.find(w => w.id === currentWireframeId);

  const handleStartTest = () => {
    if (!userName.trim() || !userEmail.trim()) return;
    setPhase('consent');
  };

  const handleAcceptConsent = () => {
    if (!consentAccepted) return;
    setPhase('testing');
  };

  const handleElementClick = (elementId: string | null) => {
    if (phase !== 'testing' || !elementId) return;

    const element = currentWireframe?.elements.find(e => e.id === elementId);
    if (!element || !element.navigationTarget) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const newClick: Click = {
      x: pointerPosition.x,
      y: pointerPosition.y,
      wireframeId: currentWireframeId,
      timestamp: new Date().toISOString(),
      correct: true
    };

    setClicks(prev => [...prev, newClick]);

    if (element.navigationTarget === '__FINISH_TEST__') {
      completeTest();
    } else {
      setCurrentWireframeId(element.navigationTarget);
    }
  };

  const handleCanvasClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (phase !== 'testing' || e.target !== e.target.getStage()) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const newClick: Click = {
      x: pointerPosition.x,
      y: pointerPosition.y,
      wireframeId: currentWireframeId,
      timestamp: new Date().toISOString(),
      correct: false
    };

    setClicks(prev => [...prev, newClick]);
  };

  const completeTest = async () => {
    if (isDemoMode) {
      showLoading("Finalizando demonstração...");
      setTimeout(() => {
        hideLoading();
        onCancel();
      }, 500);
      return;
    }

    // Record time for the very last screen before finishing
    const finalTimeSpent = Date.now() - currentScreenStartTime;
    const finalTimePerWireframe = {
      ...timePerWireframe,
      [currentWireframeId]: (timePerWireframe[currentWireframeId] || 0) + finalTimeSpent
    };

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    const clicksPerWireframe: { [wireframeId: string]: number } = {};
    clicks.forEach(click => {
      clicksPerWireframe[click.wireframeId] = (clicksPerWireframe[click.wireframeId] || 0) + 1;
    });

    const correctClicks = clicks.filter(click => click.correct).length;
    const incorrectClicks = clicks.filter(click => !click.correct).length;

    let idleTime = 0;
    if (clicks.length > 1) {
      for (let i = 1; i < clicks.length; i++) {
        idleTime += new Date(clicks[i].timestamp).getTime() - new Date(clicks[i-1].timestamp).getTime();
      }
      idleTime = duration - idleTime;
    } else if (clicks.length === 1) {
      idleTime = duration - (new Date(clicks[0].timestamp).getTime() - new Date(startTime).getTime());
    } else {
      idleTime = duration;
    }

    const session: TestSession = {
      id: uuidv4(),
      testId: test.id,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      clicks,
      startTime,
      endTime,
      completed: true,
      duration,
      clicksPerWireframe,
      timePerWireframe: finalTimePerWireframe,
      correctClicks,
      incorrectClicks,
      idleTime,
      percent: Object.entries(finalTimePerWireframe).map(([screen, time]) => ({ screen, time }))
    };
    
    console.log('[Debug] completeTest: Enviando dados da sessão:', session); // Novo log
    await onFinishTest(session);
  };

  const canvasDimensions = getCanvasDimensions();

  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Teste de Usabilidade</CardTitle>
            <p className="text-muted-foreground mt-2">
              {test.name}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Objetivo: {test.objective}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-name">Seu nome</Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            
            <div>
              <Label htmlFor="user-email">Seu e-mail</Label>
              <Input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="user-phone">Seu telefone</Label>
              <Input
                id="user-phone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="(99) 99999-9999"
              />
            </div>

            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
              <h4 className="font-medium mb-2">Instruções:</h4>
              <ul className="space-y-1">
                <li>• Você verá algumas telas de wireframe</li>
                <li>• Clique nos elementos para navegar</li>
                <li>• Todos os seus cliques serão registrados</li>
                <li>• Não há respostas certas ou erradas</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleStartTest} 
                className="flex-1"
                disabled={!userName.trim() || !userEmail.trim()}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={onReject} 
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Recusar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'consent') {    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Termo de Consentimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-3">
              <p>
                Ao participar deste teste de usabilidade, você concorda com os seguintes termos:
              </p>
              
              <ul className="space-y-2 ml-4">
                <li>• Seus cliques e interações serão registrados para fins de análise</li>
                <li>• Os dados coletados serão usados apenas para melhorar a experiência do usuário</li>
                <li>• Suas informações pessoais serão mantidas confidenciais</li>
                <li>• Você pode interromper o teste a qualquer momento</li>
                <li>• Os resultados podem ser usados em relatórios de usabilidade</li>
              </ul>
              
              <p className="text-muted-foreground">
                Este teste é apenas para fins educacionais e de pesquisa de UX.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent" 
                checked={consentAccepted}
                onCheckedChange={(checked) => setConsentAccepted(!!checked)}
              />
              <Label htmlFor="consent" className="text-sm">
                Eu li e aceito os termos de consentimento
              </Label>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAcceptConsent}
                disabled={!consentAccepted}
                className="flex-1"
              >
                Iniciar teste
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'disqualified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md text-center p-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-red-800">
              Participação Encerrada
            </CardTitle>
            <p className="text-muted-foreground mt-3 text-lg">
              Agradecemos seu interesse, mas você não atende aos critérios para este teste.
            </p>
          </CardHeader>
          <CardContent className="mt-6">
            <Button onClick={onCancel} className="w-full" size="lg">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Testing phase
  if (phase === 'testing' && test.type !== 'pesquisa' && currentWireframe) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="border-b border-border p-4 bg-card">
          <div className="text-center">
            <h3 className="text-lg">Teste de Usabilidade</h3>
            <p className="text-sm text-muted-foreground">
              Navegue pela interface clicando nos elementos • {clicks.length} cliques registrados
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
          <WireframeCanvas
            ref={stageRef}
            project={project}
            wireframe={currentWireframe}
            zoom={zoom}
            selectedElementId={null}
            onSelectElement={handleElementClick}
            onUpdateElement={() => {}}
            onElementDragEnd={() => {}}
            onElementTransformEnd={() => {}}
            canvasDimensions={canvasDimensions}
            gridConfig={{ enabled: false, columns: 12, gap: 16, margin: 24, color: 'red', opacity: 0.1 }}
            getFontSize={getFontSize}
            getFontFamilyCSS={() => 'Inter'}
            getElementMinimumSize={() => 5}
            onCanvasMouseDown={handleCanvasClick}
            isReadOnly={true}
          />
        </div>
      </div>
    );
  }

  return null;
}