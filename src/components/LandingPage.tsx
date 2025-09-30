import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { ArrowRight, Zap, BarChart3, MousePointer, Palette, Play, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../utils/supabase/supabaseClient'; // Import supabase client
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  projectsCreated: number;
  reportsGenerated: number;
  role: 'admin' | 'user'; // Added role property
}

interface LandingPageProps {
  onLogin: (user: User) => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [currentTab, setCurrentTab] = useState<'login' | 'register'>('login');
  const [showPlans, setShowPlans] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animated blobs
  const blobs = [
    { id: 1, color: 'rgba(147, 51, 234, 0.1)', size: '300px', x: '10%', y: '20%' },
    { id: 2, color: 'rgba(234, 179, 8, 0.08)', size: '250px', x: '80%', y: '10%' },
    { id: 3, color: 'rgba(236, 72, 153, 0.1)', size: '200px', x: '15%', y: '70%' },
    { id: 4, color: 'rgba(59, 130, 246, 0.08)', size: '180px', x: '75%', y: '65%' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Fetch user profile from users_profile table
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .select('name, role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        const loggedUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: profileData.name || data.user.email.split('@')[0],
          plan: 'free', // Default plan for now
          projectsCreated: 0,
          reportsGenerated: 0,
          role: profileData.role, // Use role from users_profile
        };
        onLogin(loggedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) throw authError;

      if (data.user) {
        // Insert into users_profile table
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .insert([
            { id: data.user.id, email: data.user.email, name: formData.name, role: 'user' } // Default role to 'user' on registration
          ]);

        if (profileError) throw profileError;

        toast.success('Registro bem-sucedido! Redirecionando...');
        const registeredUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: formData.name || data.user.email.split('@')[0],
          plan: 'free', // Default plan for now
          projectsCreated: 0,
          reportsGenerated: 0,
          role: 'user', // Role is now explicitly 'user' on registration
        };
        onLogin(registeredUser); // Log in the user immediately after registration
      } else {
        toast.info('Registro bem-sucedido! Por favor, verifique seu e-mail para confirmar sua conta.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar.');
      toast.error(err.message || 'Erro ao registrar.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showPlans) { 
    return (
        <div></div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background blobs */}
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full blur-3xl"
          style={{
            backgroundColor: blob.color,
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6 + blob.id,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">WireTest</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                Sobre
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Column - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-sm">Design & Usabilidade</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl lg:text-6xl leading-tight"
                >
                  Transforme
                  <span className="block">
                    <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                      ideias
                    </span>{" "}
                    em{" "}
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      realidade
                    </span>
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-muted-foreground leading-relaxed"
                >
                  Crie wireframes profissionais e realize testes de usabilidade com mapas de calor detalhados.
                  Otimize a experiência do usuário com dados reais e relatórios de desempenho.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Editor Visual</p>
                    <p className="text-sm text-muted-foreground">Arraste e solte</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-muted-foreground">Mapas de calor</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Testes</p>
                    <p className="text-sm text-muted-foreground">Sem necessidade de login</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button size="lg" className="group">
                  Começar agora
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="backdrop-blur-sm">
                  <Play className="w-4 h-4 mr-2" />
                  Ver demonstração
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column - Auth Forms */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
                <CardHeader className="space-y-4">
                  <div className="flex border border-border/50 rounded-lg p-1 bg-muted/30">
                    <button
                      onClick={() => setCurrentTab('login')}
                      className={`flex-1 py-2 px-4 rounded-md transition-all ${
                        currentTab === 'login'
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setCurrentTab('register')}
                      className={`flex-1 py-2 px-4 rounded-md transition-all ${
                        currentTab === 'register'
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Cadastro
                    </button>
                  </div>
                </CardHeader>

                <CardContent>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                      <strong className="font-bold">Erro:</strong>
                      <span className="block sm:inline"> {error}</span>
                    </div>
                  )}
                  {currentTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Carregando...' : 'Entrar'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Seu nome"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Carregando...' : 'Criar conta'}
                      </Button>
                    </form>
                  )}

                  <div className="mt-6">
                    <Separator className="my-4" />
                    <p className="text-xs text-center text-muted-foreground">
                      Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
                    </p>
                     <p className="text-xs text-center text-muted-foreground mt-2">
                      Quer ganhar dinheiro testando?{" "}
                      <a href="/?view=signup-tester" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Cadastre-se como testador
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
