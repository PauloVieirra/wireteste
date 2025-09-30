import React from 'react';

interface ChooseTestTypeProps {
  onNavigate: () => void;
}

const ChooseTestType: React.FC<ChooseTestTypeProps> = ({ onNavigate }) => {

  console.log("ChooseTestType component mounted."); // Adicionado para depuração
  const handleRealPeopleTest = () => {
    onNavigate();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configurar Novo Teste</h1>
      <p className="mb-6">Escolha como você gostaria de realizar o teste.</p>
      
      <div className="space-y-4">
        <div
          className="border p-4 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={handleRealPeopleTest}
        >
          <h2 className="text-xl font-semibold">Testar com pessoas reais</h2>
          <p>Recrute e gerencie um grupo de testadores para participar do seu protótipo.</p>
        </div>
        
        <div className="border p-4 rounded-lg bg-gray-200 cursor-not-allowed">
          <h2 className="text-xl font-semibold text-gray-500">Testar com IA</h2>
          <p className="text-gray-500">Use agentes de IA para simular o comportamento do usuário e coletar feedback (em breve).</p>
        </div>
      </div>
    </div>
  );
};

export default ChooseTestType;