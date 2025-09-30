import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { useToast } from './ToastProvider';

const TesterSignupPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'tester',
          name: name,
        },
      },
    });

    if (error) {
      showToast(`Erro no cadastro: ${error.message}`, 'error');
    } else {
      showToast('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação.', 'success');
      // Maybe redirect to a "check your email" page or back to login
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Faça Renda Extra no Seu Tempo Livre</h1>
            <p className="mt-2 text-lg text-gray-600">Participe de testes de software e aplicativos de forma remunerada.</p>
        </div>
        <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Crie sua Conta de Testador</h2>
            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input 
                        id="name" 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                </div>
                <div>
                    <label htmlFor="password" class="block text-sm font-medium text-gray-700">Senha</label>
                    <input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                    {loading ? 'Criando conta...' : 'Quero ser testador'}
                </button>
            </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
            Já tem uma conta? <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">Faça login</a>
        </p>
      </div>
    </div>
  );
};

export default TesterSignupPage;
