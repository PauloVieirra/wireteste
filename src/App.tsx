import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectList } from './components/ProjectList';
import { WireframeEditor } from './components/WireframeEditor';
import { TestCreator } from './components/TestCreator';
import { Dashboard } from './components/Dashboard';
import { UserSessionDetail } from './components/UserSessionDetail';
import { UserTestInterface } from './components/UserTestInterface';
import { LandingPage } from './components/LandingPage';
import { UserHomePage } from './components/UserHomePage';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { ToastProvider, useToast } from './components/ToastProvider';
import { Button } from './components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getProjectsByUser, getTestsByUser, getSurveysByUser, getTestSessionsByUser, saveTest as saveTestToDb, saveSurvey, getTestById, getSurveyById, getProjectById, deleteProjectById, deleteTestById, deleteSurveyById, saveTestSession, saveOrUpdateProject } from './utils/supabase/supabaseClient';
import { supabase } from './utils/supabase/client';
import { NewProjectModal } from './components/NewProjectModal';
import { CreateWireframeDialog } from './components/CreateWireframeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';
import { CreateUsabilityTest } from './components/CreateUsabilityTest';
import ChooseTestType from './components/ConfigureTest/ChooseTestType';
import ProfileForm from './components/UserProfile/ProfileForm';
import CreateTestGroup from './components/ConfigureTest/CreateTestGroup';
import { ConfigureTestModal } from './components/ConfigureTest/ConfigureTestModal';
import TesterSignupPage from './components/TesterSignupPage';
import IncompleteProfileNotification from './components/IncompleteProfileNotification';
import localforage from 'localforage'; // Import localforage
import { useOnlineStatus } from './hooks/useOnlineStatus'; // Importar o hook de status online
// import ManageTestScreen from './components/ManageTestScreen'; // Removido: Importar ManageTestScreen
import { Loader2 } from 'lucide-react'; // Importar Loader2 para o estado de carregamento
import { useLoading } from './components/GlobalLoading'; // Importar useLoading

// --- TYPE DEFINITIONS ---

// Generic type for display
export interface DisplayItem {
  id: string;
  type: 'wireframe' | 'mapa_calor';
  name: string;
  createdAt: string;
  resolution?: 'mobile' | 'tablet' | 'desktop';
  wireframe_count?: number;
  projectId?: string; // Renamed from project_id for consistency
  testId?: string; // Add testId to link wireframe to its primary usability test
  hasTestData?: boolean;
  original: any;
}

interface Project {
  id: string;
  name: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: Wireframe[];
  createdAt: string;
  updated_at: string;
  gridConfig?: any;
  components: any[];
}

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  projectsCreated: number;
  reportsGenerated: number;
  role: 'admin' | 'user' | 'tester'; // Added 'tester' role
}

interface Wireframe {
  id: string;
  name: string;
  elements: any[];
}

// This is the old test type for hotspots
interface Test {
  id: string;
  projectId: string;
  name: string;
  hotspots: any[];
  flows: any[];
  sharedWithUserEmail?: string;
}

// This is for the new tests from the 'tests' table
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



interface TestSession {
  id: string;
  testId: string;
  userName: string;
  userEmail: string;
  clicks: any[];
  startTime: string;
  endTime?: string;
  completed: boolean;
}

type View = 'projects' | 'wireframe-editor' | 'test-creator' | 'dashboard' | 'user-test' | 'user-home' | 'session-detail' | 'create-usability-test' | 'profile' | 'signup-tester' | 'manage-test';

export default function App() {
  const { showToast } = useToast();
  const { showLoading, hideLoading } = useLoading(); // Usar o hook de loading
  const [currentView, setCurrentView] = useState<View>('projects');
  const [initialView, setInitialView] = useState<View>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tests, setTests] = useState<Test[]>([]); // Old hotspot tests
  const [usabilityTests, setUsabilityTests] = useState<UsabilityTest[]>([]); // New heatmap/eye/face tests
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
  const [selectedItemForDashboard, setSelectedItemForDashboard] = useState<DisplayItem | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isTesterProfileIncomplete, setIsTesterProfileIncomplete] = useState(false);
  const [unsavedProjectIds, setUnsavedProjectIds] = useState<string[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCreateWireframeDialogOpen, setIsCreateWireframeDialogOpen] = useState(false);
  const [isConfigureTestModalOpen, setIsConfigureTestModalOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<any>(null); // Old hotspot test
  const [refreshUserInboxKey, setRefreshUserInboxKey] = useState(0); // Novo estado para forçar recarga da caixa de entrada
  // const [isLoading, setIsLoading] = useState(true); // Removido: Usar useLoading
  const [sendingMessage, setSendingMessage] = useState('');
  const isOnline = useOnlineStatus(); // Usar o hook de status online
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Novo estado para controlar alterações não salvas
  const [viewHistory, setViewHistory] = useState<View[]>([]); // Histórico de visualizações
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);


  const offlineToastShownRef = useRef(false); // Novo ref para controlar o toast offline
  const unsavedChangesToastShownRef = useRef(false); // Novo ref para controlar o toast de alterações não salvas

  // --- DATA FETCHING AND OFFLINE PERSISTENCE ---
  const fetchAllData = async (currentUser: User | null) => {
    if (!currentUser) return;
    showLoading("Carregando dados..."); // Ativar loading

    try {
      if (isOnline) {
        // Resetar o ref de toast offline ao ficar online
        offlineToastShownRef.current = false;
        unsavedChangesToastShownRef.current = false; // Resetar este também
        
        const [dbProjects, dbTests, dbTestSessions] = await Promise.all([
          getProjectsByUser(currentUser),
          getTestsByUser(currentUser),
          getTestSessionsByUser(currentUser)
        ]);
        console.log("Fetched Test Sessions (Online): ", dbTestSessions);
        
        await localforage.setItem('projects', dbProjects);
        await localforage.setItem('usabilityTests', dbTests);
        await localforage.setItem('testSessions', dbTestSessions);

        setProjects(dbProjects);
        setUsabilityTests(dbTests);
        setTestSessions(dbTestSessions);
        showToast("Dados sincronizados com o servidor.", "success");
      } else {
        // Carrega do localforage se offline
        if (!offlineToastShownRef.current) {
          showToast("Trabalhando offline: carregando dados locais.", "info");
          offlineToastShownRef.current = true;
        }
        const localProjects = await localforage.getItem<Project[]>('projects') || [];
        const localUsabilityTests = await localforage.getItem<UsabilityTest[]>('usabilityTests') || [];
        const localTestSessions = await localforage.getItem<TestSession[]>('testSessions') || [];

        setProjects(localProjects);
        setUsabilityTests(localUsabilityTests);
        setTestSessions(localTestSessions);
      }
    } catch (error) {
      console.error("Failed to sync or load data:", error);
      if (!offlineToastShownRef.current) {
        showToast(`Erro ao carregar dados: ${error instanceof Error ? error.message : String(error)}. Carregando dados locais.`, "error");
        offlineToastShownRef.current = true;
      }
      // Tenta carregar do localforage mesmo com erro online
      const localProjects = await localforage.getItem<Project[]>('projects') || [];
      const localUsabilityTests = await localforage.getItem<UsabilityTest[]>('usabilityTests') || [];
      const localTestSessions = await localforage.getItem<TestSession[]>('testSessions') || [];
      setProjects(localProjects);
      setUsabilityTests(localUsabilityTests);
      setTestSessions(localTestSessions);
      if (localProjects.length > 0) {
        // showToast("Dados locais carregados devido a erro na sincronização.", "warning"); // Este toast agora está coberto pelo acima
      }
    } finally {
      hideLoading(); // Desativar loading
    }
  };

  // Função para salvar um projeto atualizado localmente e definir hasUnsavedChanges
  const handleLocalProjectUpdate = async (updatedProject: Project) => {
    // Primeiro, atualize o estado local dos projetos
    setProjects(prevProjects => {
      const newProjects = prevProjects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      // Em seguida, salve a lista atualizada no localforage
      localforage.setItem('projects', newProjects); 
      return newProjects;
    });
    setSelectedProject(updatedProject); // Manter o projeto selecionado atualizado
    setHasUnsavedChanges(true); // Indica que há alterações não salvas
  };

  // Função para sincronizar alterações locais com o Supabase
  const syncLocalChanges = async () => {
    if (!user || !isOnline) return; 

    showLoading("Sincronizando alterações locais..."); // Ativar loading
    try {
      const localProjects = await localforage.getItem<Project[]>('projects') || [];
      for (const localProject of localProjects) {
        const dbProject = await getProjectById(localProject.id); 
        const localData = {
          resolution: localProject.resolution,
          wireframes: localProject.wireframes,
          gridConfig: localProject.gridConfig,
        };
        const dbData = dbProject ? {
          resolution: dbProject.resolution,
          wireframes: dbProject.wireframes,
          gridConfig: dbProject.gridConfig,
        } : null;

        if (!dbProject || JSON.stringify(localData) !== JSON.stringify(dbData)) {
          await saveOrUpdateProject(localProject); 
        }
      }
      setHasUnsavedChanges(false); 
      unsavedChangesToastShownRef.current = false; // Resetar o ref após sincronização
      showToast("Alterações locais sincronizadas com sucesso!", "success");
      await fetchAllData(user); 
    } catch (error) {
      console.error("Erro ao sincronizar alterações locais:", error);
      showToast(`Erro ao sincronizar: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      hideLoading(); // Desativar loading
    }
  };

  // Função para mudar a visualização e registrar no histórico
  const navigateTo = (view: View) => {
    setCurrentView(prevView => {
      setViewHistory(prevHistory => [...prevHistory, prevView]);
      return view;
    });
  };

  // --- UNIFIED DISPLAY LIST (for admins) ---
  const displayList: DisplayItem[] = useMemo(() => {
    const wireframeItems: DisplayItem[] = projects.map(p => {
      const associatedTest = usabilityTests.find(t => t.config?.projectId === p.id);
      const hasTestData = associatedTest ? testSessions.some(s => s.testId === associatedTest.id) : false;
      console.log(`Project: ${p.name}, Associated Test ID: ${associatedTest?.id}, Test Sessions IDs: ${testSessions.map(s => s.testId)}, Has Test Data: ${hasTestData}`);
      return {
        id: p.id, type: 'wireframe', name: p.name, createdAt: p.createdAt,
        resolution: p.resolution, wireframe_count: p.wireframes.length,
        projectId: p.id, testId: associatedTest?.id, hasTestData, original: p,
      };
    });
    return [...wireframeItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, usabilityTests, testSessions]);


  // --- EFFECTS ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const testIdFromUrl = params.get('testId');

    const handleExternalTest = async (testId: string) => {
      showLoading("Iniciando teste..."); // Ativar loading
      await handleStartUserTest(testId);
      hideLoading(); // Desativar loading
    };

    if (viewParam === 'user-test' && testIdFromUrl) {
      handleExternalTest(testIdFromUrl);
      return; // Stop further execution to avoid auth checks
    }

    if (viewParam === 'signup-tester') {
        setInitialView('signup-tester');
    }

    const handleUserSession = async (sessionUser: any) => {
        showLoading("Verificando sessão de usuário..."); // Ativar loading
        // Busca a role do users_profile, ou usa 'user' como padrão se não encontrada
        const { data: userProfileData, error: userProfileError } = await supabase
            .from('users_profile')
            .select('role')
            .eq('id', sessionUser.id)
            .single();

        const role = userProfileData?.role || 'user';

        const appUser: User = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: sessionUser.user_metadata.name || 'User',
            plan: 'pro',
            projectsCreated: 0,
            reportsGenerated: 0,
            role: role,
        };
        setUser(appUser);

        // Persiste o ID do usuário para o hook de notificação
        await localforage.setItem('userId', appUser.id);

        await fetchAllData(appUser); // Chamar fetchAllData para todos os usuários

        // Redireciona com base na role
        if (appUser.role === 'admin') {
          setCurrentView('projects');
        } else if (appUser.role === 'user') { // Assumindo 'user' como o role de testador
              setIsTesterProfileIncomplete(false); // Manter como false, já que não é obrigatório
              setCurrentView('user-home'); // Página inicial do testador (caixa de entrada)
        } else {
          setCurrentView('projects'); // Fallback para outros roles
        }
        hideLoading(); // Desativar loading
    };

    const checkSession = async () => {
      showLoading("Verificando sessão..."); // Ativar loading
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        // No user, might be signup view
        if (viewParam === 'signup-tester') {
          setCurrentView('signup-tester');
        }
        hideLoading(); // Desativar loading
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (testIdFromUrl) return;
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setUser(null);
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'signup-tester') {
            navigateTo('signup-tester'); // Usar navigateTo
        } else if (currentView !== 'user-test') { // Do not redirect if on a public test
            navigateTo('projects'); // Usar navigateTo
        }
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, [isOnline]); // Adicionado isOnline como dependência para re-executar ao mudar o status da conexão

  useEffect(() => {
    if (user && isOnline && hasUnsavedChanges && !unsavedChangesToastShownRef.current) {
      showToast("Você está online e tem alterações locais não salvas. Clique em 'Atualizar e Salvar o trabalho' para sincronizar.", "warning");
      unsavedChangesToastShownRef.current = true; // Marca o toast como exibido
    } else if (!isOnline) {
      // Se ficar offline, resetar o ref de toast de alterações não salvas para que ele possa aparecer novamente ao voltar online
      unsavedChangesToastShownRef.current = false;
    }
  }, [isOnline, hasUnsavedChanges, user, showToast]);

  // ... other handlers ...
  const handleGoToProfile = () => {
    navigateTo('profile'); // Usar navigateTo
  };

  const handleConfigureTest = (project: any) => {
    setSelectedProject(project);
    setIsConfigureTestModalOpen(true);
  };

  // const handleManageTest = (project: any) => { // Removido: Nova função para gerenciar testes
  //   setSelectedProject(project);
  //   navigateTo('manage-test');
  // };

  const handleStartUserTest = async (testId: string, isDemo: boolean = false) => {
    if (!testId) return;
    setIsDemoMode(isDemo);
    showLoading("Iniciando teste..."); // Ativar loading
    try {
      const test = await getTestById(testId);
      if (test && test.config?.projectId) {
        const project = await getProjectById(test.config.projectId);
        setActiveTest(test);
        setSelectedProject(project);
        navigateTo('user-test'); // Usar navigateTo
      } else {
        console.error("Teste ou ID do projeto não encontrado na configuração do teste.");
      }
    } catch (error) {
      console.error("Erro ao iniciar o teste:", error);
    } finally {
      hideLoading(); // Desativar loading
    }
  };

  const navigateBack = async () => {
    showLoading("Saindo..."); // Ativar loading ao sair

    if (user) {
      await fetchAllData(user);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('testId')) {
      setActiveTest(null);
      navigateTo('projects'); // Usar navigateTo
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
      hideLoading(); // Desativar loading antes de recarregar a página
      return;
    }

    // Remove a visualização atual do histórico e volta para a anterior
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setCurrentView(previousView);
      setViewHistory(prevHistory => prevHistory.slice(0, -1)); // Remove a última do histórico
    } else {
      // Se não há histórico, volta para a visualização padrão (projects)
      setCurrentView('projects');
    }
    setSelectedProject(null); 
    setSelectedItemForDashboard(null);
    setActiveTest(null);
    hideLoading(); // Desativar loading antes de navegar
  };

  const goBack = async () => {
    if (currentView === 'wireframe-editor' && hasUnsavedChanges) {
      setIsExitConfirmOpen(true);
      return;
    }
    navigateBack();
  };

  const handleSaveAndExit = async () => {
    setIsExitConfirmOpen(false);
    await syncLocalChanges();
    navigateBack();
  };


  // Função para finalizar um teste


  // Função para finalizar um teste
  const handleFinishTest = async (session: any) => {
    showLoading("Finalizando seu teste..."); // Ativar loading
    console.log("DEBUG handleFinishTest: Iniciando a finalização do teste.", session);

    try {
      // Salvar a sessão de teste
      console.log("DEBUG handleFinishTest: Tentando salvar a sessão de teste.", session);
      await saveTestSession(session);
      setTestSessions(prev => [...prev, session]);
      console.log("DEBUG handleFinishTest: Sessão de teste salva com sucesso.");

      if (user) { // All user-specific logic should be inside this block
        const test = usabilityTests.find(t => t.id === session.testId);
        if (test) {
          const project = projects.find(p => p.id === test.config?.projectId);
          if (project) {
            showToast(`Novo teste respondido para o projeto: ${project.name}`, 'success');
          }
        }

        // 2. Atualizar o status do convite na tabela emails (integrado aqui)
        console.log("DEBUG handleFinishTest: Tentando buscar email para atualização.");
        const { data: emailRow, error: fetchError } = await supabase
          .from('emails')
          .select('messages')
          .eq('receiver_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Erro ao buscar email para atualizar:", fetchError);
          showToast('Teste finalizado, mas houve erro ao atualizar convite.', 'error');
          // Continuar mesmo com erro no email, mas logar
        }
        console.log("DEBUG handleFinishTest: Email Row Retornado para atualização.", emailRow);

        if (emailRow) {
          let updatedMessages = (emailRow.messages as any[]).map(message => {
            if (message.testId === session.testId) { // Usa session.testId
              return { ...message, status: 'completed' };
            }
            return message;
          });

          console.log("DEBUG handleFinishTest: Tentando atualizar status do convite.", updatedMessages);
          const { error: updateError } = await supabase
            .from('emails')
            .update({ messages: updatedMessages, last_updated_at: new Date().toISOString() })
            .eq('receiver_id', user.id);

          if (updateError) {
            console.error("Erro ao atualizar status do convite:", updateError);
            showToast('Teste finalizado, mas houve erro ao atualizar convite.', 'error');
            // Continuar mesmo com erro no email, mas logar
          }
          console.log("DEBUG handleFinishTest: Status do convite atualizado com sucesso (se aplicável).");
        }

        // Lógica de redirecionamento pós-teste
        console.log("DEBUG handleFinishTest: Iniciando redirecionamento.", user.role);
        if (user.role === 'user') {
          setRefreshUserInboxKey(prev => prev + 1); // Força a recarga da caixa de entrada
          navigateTo('user-home'); // Redireciona para a caixa de entrada do testador
        } else if (user.role === 'admin') {
          navigateTo('projects'); // Redireciona para projetos do admin
        } else {
          // Fallback para usuários não logados ou outros roles (pode ser a página inicial pública)
          window.location.href = window.location.origin; 
        }
      } else {
        // Lógica para usuários não logados
        showToast('Teste finalizado com sucesso! Obrigado por sua participação.', 'success');
        // Redirect to landing page
        setTimeout(() => {
            window.location.href = window.location.origin;
        }, 2000); // Delay to allow user to see the toast
      }

    } catch (error) {
      console.error("DEBUG handleFinishTest: Erro fatal durante a finalização do teste:", error); // Log mais explícito
      showToast('Erro ao finalizar teste.', 'error');
      hideLoading(); // Hide loading on error
      if (user) {
        goBack(); // Volta para a tela anterior em caso de erro
      } else {
        window.location.href = window.location.origin;
      }
    }
  };

  const handleTestCreated = async (session: any) => { // Corrigido para aceitar 'session' em vez de 'testId'
    if (user) {
      showLoading("Processando criação do teste..."); // Ativar loading
      await fetchAllData(user);
      hideLoading(); // Desativar loading
    }
  };

  // --- RENDER LOGIC ---

  if (currentView === 'sending-test') { // Removido: O GlobalLoading cuidará disso
    return (
      <div className="flex-1 flex items-center justify-center bg-muted" style={{ minHeight: '100vh' }}>
        <div className="text-center max-w-md bg-opacity-20">
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center relative">
            <div className="absolute w-24 h-2 bg-muted-foreground rotate-45 animate-pulse"></div>
            <div className="absolute w-2 h-12 bg-primary rounded-full rotate-12 animate-bounce"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-2 border-primary animate-spin-slow"></div>
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-muted-foreground animate-ping"></div>
          </div>
          <h2>{currentView === 'sending-test' ? sendingMessage : 'Carregando...'}</h2>
        </div>
      </div>
    )
  }

  // --- RENDER LOGIC ---

  // Unauthenticated views
  if (!user) {
    if (currentView === 'user-test') {
      return (
          <main className="flex-1">
            {activeTest && (
              <UserTestInterface 
                test={activeTest} 
                project={selectedProject}
                onFinishTest={handleFinishTest}
                onCancel={goBack}
              />
            )}
          </main>
      );
    }
    if (currentView === 'signup-tester') {
      return <TesterSignupPage />;
    }
    return <LandingPage onLogin={() => {}} />;
  }

  // Authenticated views
  return (
      <ToastProvider>
        <AuthenticatedLayout user={user} onLogout={() => supabase.auth.signOut()} hasUnsavedChanges={hasUnsavedChanges} onSyncLocalChanges={syncLocalChanges}> {/* Passa hasUnsavedChanges */}
          {isTesterProfileIncomplete && user.role === 'tester' && currentView !== 'profile' && (
            <IncompleteProfileNotification onCompleteProfile={handleGoToProfile} />
          )}
          
          <NewProjectModal
            isOpen={isNewProjectModalOpen}
            onClose={() => setIsNewProjectModalOpen(false)}
            onSelectType={(type) => {
              setIsNewProjectModalOpen(false);
              if (type === 'wireframe') {
                setIsCreateWireframeDialogOpen(true);
              }
            }}
          />
          <CreateWireframeDialog
            isOpen={isCreateWireframeDialogOpen}
            onClose={() => setIsCreateWireframeDialogOpen(false)}
            onCreateProject={async (name, resolution, description) => {
              const newProject: Project = {
                id: uuidv4(),
                name,
                resolution,
                description,
                wireframes: [],
                createdAt: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                components: [],
              };
              
              showLoading("Criando novo projeto...");
              try {
                // Salva primeiro no banco de dados
                await saveOrUpdateProject(newProject);
                
                // Atualiza o estado local e o localforage
                handleLocalProjectUpdate(newProject);
                
                // Limpa o estado de "alterações não salvas" para este novo projeto
                setHasUnsavedChanges(false);
                unsavedChangesToastShownRef.current = false;

                showToast("Projeto criado com sucesso!", "success");
                
                // Navega para o editor
                setIsCreateWireframeDialogOpen(false);
                setSelectedProject(newProject);
                navigateTo('wireframe-editor');
              } catch (error) {
                console.error("Erro ao criar novo projeto:", error);
                showToast(`Erro ao criar projeto: ${error instanceof Error ? error.message : String(error)}`, "error");
              } finally {
                hideLoading();
              }
            }}
          />

          <ConfigureTestModal
            isOpen={isConfigureTestModalOpen}
            onClose={() => setIsConfigureTestModalOpen(false)}
            selectedProject={selectedProject}
          />

          <AlertDialog open={isExitConfirmOpen} onOpenChange={setIsExitConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair do modo de edição?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você possui alterações não salvas. Para não perdê-las, salve antes de sair.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveAndExit}>Salvar e Sair</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>


          {currentView !== 'projects' && currentView !== 'user-home' && (
            <header className="border-b border-border bg-card">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <h1 className="text-xl font-medium">
                    {currentView === 'profile' && 'Meu Perfil'}
                    {currentView === 'configure-test' && 'Configurar Novo Teste'}
                    {currentView === 'create-test-group' && 'Criar Grupo de Teste'}
                    {currentView === 'user-test' && activeTest?.name}
                    {currentView === 'dashboard' && `Dashboard: ${selectedItemForDashboard?.name}`}
                  </h1>
                </div>
              </div>
            </header>
          )}

          <main className="flex-1">
            {currentView === 'projects' && (
              <ProjectList
                items={displayList}
                user={user}
                onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                onEditProject={(project) => {
                  setSelectedProject(project);
                  navigateTo('wireframe-editor'); // Usar navigateTo
                }}
                onViewDashboard={(item) => {
                  setSelectedItemForDashboard(item);
                  navigateTo('dashboard'); // Usar navigateTo
                }}
                onStartUserTest={(testId, testType, isDemo) => handleStartUserTest(testId, isDemo || false)}
                onDeleteProject={async (itemId, itemType) => {
                  try {
                    showLoading("Deletando projeto..."); // Ativar loading
                    if (itemType === 'wireframe') {
                      await deleteProjectById(itemId);
                    } // Adicionar lógica para outros tipos se necessário
                    await fetchAllData(user); // Re-busca dados do DB e atualiza localforage
                    showToast('Projeto excluído com sucesso!', 'success');
                  } catch (error) {
                    console.error("Erro ao deletar projeto:", error);
                    showToast(`Erro ao deletar projeto: ${error instanceof Error ? error.message : String(error)}`, "error");
                  } finally {
                    hideLoading(); // Desativar loading
                  }
                }}
                onCreateTest={(project) => {
                  setSelectedProject(project);
                  navigateTo('create-usability-test'); // Usar navigateTo
                }}
                onConfigureTest={handleConfigureTest}
                // onManageTest={handleManageTest} // Removido
              />
            )}

            {currentView === 'dashboard' && selectedItemForDashboard && (
              <Dashboard
                item={selectedItemForDashboard}
              />
            )}

            {currentView === 'user-test' && activeTest && (
              <UserTestInterface 
                test={activeTest} 
                project={selectedProject}
                onFinishTest={handleFinishTest}
                onCancel={goBack}
                isDemoMode={isDemoMode}
              />
            )}

            {currentView === 'create-usability-test' && selectedProject && (
              <CreateUsabilityTest
                user={user}
                selectedProject={selectedProject}
                onSaveTest={async (testData) => {
                  showLoading("Salvando teste de usabilidade..."); // Ativar loading
                  await saveTestToDb(testData);
                  await fetchAllData(user);
                  navigateTo('projects'); // Usar navigateTo
                  hideLoading(); // Desativar loading
                }}
              />
            )}

            {currentView === 'wireframe-editor' && selectedProject && (
              <WireframeEditor
                project={selectedProject}
                onUpdateProject={handleLocalProjectUpdate} // Usar a nova função de atualização local
              />
            )}

            {currentView === 'user-home' && user.role === 'user' && (
              <UserHomePage onGoToProfile={handleGoToProfile} refreshKey={refreshUserInboxKey} />
            )}

            {currentView === 'profile' && (
              <ProfileForm />
            )}



            {/* Removido: O GlobalLoading cuidará disso */}
            {/* {currentView === 'sending-test' && sendingMessage && ( 
              <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
                <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mb-4" />
                <p className="text-xl font-medium">{sendingMessage}</p>
              </div>
            )} */}
          </main>
        </AuthenticatedLayout>
      </ToastProvider>
  );
}
