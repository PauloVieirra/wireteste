import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Menu, 
  LogOut, 
  User, 
  Calendar, 
  ExternalLink,
  Info,
  Crown,
  Zap
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator'; // Importa o novo componente

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  projectsCreated: number;
  reportsGenerated: number;
}

interface AuthenticatedLayoutProps {
  user: User;
  children: React.ReactNode;
  onLogout: () => void;
  hasUnsavedChanges: boolean; // Adicionado para o indicador de status
  onSyncLocalChanges: () => void; // Adicionar nova prop
}

export function AuthenticatedLayout({ user, children, onLogout, hasUnsavedChanges, onSyncLocalChanges }: AuthenticatedLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const planConfig = {
    free: { 
      label: 'Grátis', 
      color: 'secondary' as const, 
      icon: Zap,
      projectLimit: 2,
      reportLimit: 1
    },
    pro: { 
      label: 'Pro', 
      color: 'default' as const, 
      icon: Crown,
      projectLimit: Infinity,
      reportLimit: Infinity
    },
    enterprise: { 
      label: 'Enterprise', 
      color: 'destructive' as const, 
      icon: Crown,
      projectLimit: Infinity,
      reportLimit: Infinity
    }
  };

  // Adicionado um null-check para evitar quebras se o usuário for nulo
  if (!user) {
    return null; // Ou um spinner de carregamento, ou uma mensagem de erro
  }

  const currentPlan = planConfig[user.plan];
  const PlanIcon = currentPlan.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Menu Hamburger */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Abrir menu principal">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetTitle className="sr-only">Menu Principal</SheetTitle>
                <SheetDescription className="sr-only">
                  Menu com informações do sistema, desenvolvedor e opções de logout
                </SheetDescription>
                <div className="flex flex-col h-full">
                  {/* Header do Menu */}
                  <div className="py-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="font-medium">WireTest</h2>
                        <p className="text-xs text-muted-foreground">v1.0.0</p>
                      </div>
                    </div>
                    
                    {/* Informações do Projeto */}
                    <Card className="mb-6">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          <CardTitle className="text-sm">Informações do Sistema</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Versão:</span>
                          <span>1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Última atualização:</span>
                          <span>13 Set 2025</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="secondary" className="text-xs">
                            Ativo
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card do Autor */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Desenvolvedor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src="" alt="Paulo Vieira" />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              PV
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">Paulo Vieira</p>
                            <p className="text-sm text-muted-foreground">Product Design</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3 w-full"
                              onClick={() => window.open('https://vgents.vercel.app/', '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-2" />
                              Portfólio
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Footer do Menu */}
                  <div className="mt-auto pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                          <LogOut className="w-4 h-4 mr-2" />
                          Deslogar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar logout</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza de que deseja sair da sua conta? Você precisará fazer login novamente para acessar seus projetos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={onLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sair
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="font-medium">WireTest</h1>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Badge variant={currentPlan.color} className="flex items-center gap-1">
                <PlanIcon className="w-3 h-3" />
                {currentPlan.label}
              </Badge>
              
              {user.plan === 'free' && (
                <div className="text-xs text-muted-foreground">
                  {user.projectsCreated}/{currentPlan.projectLimit} projetos
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      <ConnectionStatusIndicator hasUnsavedChanges={hasUnsavedChanges} onSyncLocalChanges={onSyncLocalChanges} />
    </div>
  );
}