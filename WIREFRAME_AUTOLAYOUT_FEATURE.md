# Wireframe Auto Layout Feature

## Overview
O recurso de **Auto Layout para Wireframes** permite organizar automaticamente todos os elementos dentro de uma tela (wireframe) sem interferir nas dimensões do projeto. Este é um recurso de organização visual que ajuda a evitar sobreposição de elementos e mantém um layout organizado.

## Features

### 1. **Modo de Layout**
Escolha como os elementos devem ser organizados:

- **Desativar**: Sem organização automática (padrão)
- **Horizontal (↔️)**: Elementos organizados da esquerda para direita
- **Vertical (↕️)**: Elementos organizados de cima para baixo

### 2. **Espaçamento Entre Elementos**
Defina o espaço mínimo entre cada elemento:
- Valores em pixels (ex: 0, 8, 16, 24)
- Aplicado uniformemente entre todos os elementos

### 3. **Padding (Espaçamento Interno)**
Controle o espaço entre os elementos e as bordas do wireframe:

- **Padding Superior**: Espaço do topo
- **Padding Direito**: Espaço da direita
- **Padding Inferior**: Espaço do fundo
- **Padding Esquerdo**: Espaço da esquerda

**Modo Linked**: Aplica o mesmo padding para todos os lados simultaneamente (clique no ícone de corrente)

**Modo Individual**: Define valores diferentes para cada lado

### 4. **Alinhamento**
Controle como os elementos são distribuídos dentro do wireframe:

- **Justify Content** (distribuição principal):
  - `flex-start`: Agrupa à esquerda/topo (padrão)
  - `center`: Centraliza os elementos
  - `flex-end`: Agrupa à direita/fundo
  - `space-between`: Distribui uniformemente com espaço entre eles

- **Align Items** (alinhamento transversal):
  - `flex-start`: Alinha à esquerda/topo (padrão)
  - `center`: Centraliza na direção perpendicular
  - `flex-end`: Alinha à direita/fundo

## Como Usar

### Passo 1: Abrir as Propriedades do Wireframe
1. Na aba **Propriedades** da barra lateral direita
2. Se nenhum elemento estiver selecionado, verá as propriedades da tela (wireframe)
3. Procure a seção **Auto Layout**

### Passo 2: Ativar o Auto Layout
1. Clique em um dos botões de modo:
   - **Horizontal** para layout na horizontal
   - **Vertical** para layout na vertical

### Passo 3: Configurar Espaçamento
1. Defina o **Espaçamento entre elementos** (item spacing)
2. Configure o **Padding** usando a ferramenta de padding
3. Ajuste o **Alinhamento** usando a grade de alinhamento

### Passo 4: Desativar (Opcional)
1. Clique no botão **Desativar** para remover o auto layout
2. Os elementos mantêm suas posições atuais

## Exemplos Práticos

### Exemplo 1: Menu Horizontal Centralizado
```
Modo: Horizontal
Item Spacing: 16px
Padding: 8px (todos os lados)
Justify Content: center
Align Items: center
```
Resultado: Elementos distribuídos horizontalmente no centro da tela

### Exemplo 2: Lista Vertical com Espaçamento
```
Modo: Vertical
Item Spacing: 12px
Padding: 
  - Superior: 16px
  - Inferior: 16px
  - Esquerdo/Direito: 8px
Justify Content: flex-start
Align Items: flex-start
```
Resultado: Elementos em coluna, começando do topo com espaçamento uniforme

### Exemplo 3: Cards Distribuídos Horizontalmente
```
Modo: Horizontal
Item Spacing: 20px
Padding: 16px (todos os lados)
Justify Content: space-between
Align Items: center
```
Resultado: Cards distribuídos uniformemente, espaçados igualmente

## Notas Importantes

### ⚠️ Comportamento
- O **Auto Layout NÃO modifica o tamanho do wireframe**
- O **Auto Layout NÃO modifica a largura/altura do projeto**
- Apenas **organiza os elementos dentro das dimensões existentes**
- Os elementos mantêm suas dimensões individuais (largura e altura)

### 📍 Posicionamento
- Apenas elementos **de nível superior** são organizados automaticamente
- Elementos **dentro de frames** não são afetados pelo auto layout do wireframe
- Cada **frame pode ter seu próprio auto layout** independente

### 🔄 Sincronização
- As alterações de auto layout são **salvas automaticamente**
- O layout é **recalculado em tempo real** conforme você ajusta os valores
- O histórico de undo (Ctrl+Z) funciona normalmente

### 💾 Persistência
- As configurações de auto layout são **persistidas no projeto**
- Ao reabrir o projeto, o layout é mantido
- As configurações são salvas junto com o wireframe

## Limitações Conhecidas

1. **Ordem dos Elementos**: Os elementos são organizados na ordem em que aparecem na árvore
2. **Tamanhos Diferentes**: Se elementos tiverem tamanhos muito diferentes, pode haver espaços vazios
3. **Overflow**: Se não houver espaço suficiente, elementos podem ficar sobrepostos (use padding negativo não é suportado)

## Integração com Outros Recursos

- ✅ Funciona com **Grid Overlay**
- ✅ Funciona com **Raio X**
- ✅ Funciona com **Undo/Redo** (Ctrl+Z)
- ✅ Funciona com **Zoom**
- ✅ Funciona com **Drag & Drop** (move o wireframe inteiro)

## Arquivo de Implementação

O Auto Layout é implementado em:
- `src/hooks/useWireframeAutoLayout.ts` - Lógica de cálculo
- `src/components/WireframeCanvas.tsx` - Renderização com layout aplicado
- `src/types.ts` - Definições de tipo para Wireframe
- `src/components/WireframeEditor.tsx` - Interface de controle (UI)

## Desenvolvimento Futuro

Possíveis melhorias:
- [ ] Auto-redimensionamento de elementos baseado em conteúdo
- [ ] Constrangimentos de tamanho mínimo/máximo por elemento
- [ ] Grupos de elementos com auto layout próprio
- [ ] Animação de transição ao aplicar/desativar auto layout
- [ ] Templates de layout pré-configurados

