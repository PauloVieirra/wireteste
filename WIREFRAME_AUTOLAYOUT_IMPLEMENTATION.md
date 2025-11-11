# Resumo: Auto Layout para Wireframes

## 📋 O Que Foi Implementado

Adicionado suporte completo para **Auto Layout em Wireframes** (telas), permitindo organizar automaticamente todos os elementos dentro de uma tela sem interferir nas dimensões do projeto.

## 🔧 Mudanças Técnicas

### 1. **Atualização de Tipos** (`src/types.ts`)
- Adicionadas propriedades de auto-layout à interface `Wireframe`:
  - `layoutMode`: 'none' | 'horizontal' | 'vertical'
  - `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`: Espaçamento interno
  - `itemSpacing`: Espaço entre elementos
  - `justifyContent`: Distribuição principal
  - `alignItems`: Alinhamento transversal

### 2. **Novo Hook** (`src/hooks/useWireframeAutoLayout.ts`)
- Implementado `useWireframeAutoLayout()` que fornece:
  - `calculateAutoLayout()`: Função que recalcula posições dos elementos
  - Lógica para layout **horizontal** e **layout vertical**
  - Suporte a `justify-content` e `align-items` como flexbox
  - Cálculo de posições respeitando padding e espaçamento

### 3. **Integração no WireframeCanvas** (`src/components/WireframeCanvas.tsx`)
- Importado `useWireframeAutoLayout`
- Adicionado `useMemo` para aplicar layout aos elementos antes de renderizar
- Atualizada interface `Wireframe` local com novas propriedades
- Elementos renderizados com posições recalculadas pelo auto-layout

### 4. **Interface de Usuário** (`src/components/WireframeEditor.tsx`)
- Importado `AlignmentPicker` do componente existente
- Adicionada seção **Auto Layout** na aba de propriedades do wireframe:
  - **3 Botões de Modo**: Desativar, Horizontal, Vertical
  - **Slider de Item Spacing**: Controla espaço entre elementos
  - **PaddingPicker**: Interface para padding com modo linked/individual
  - **AlignmentPicker**: Grade 3x3 para escolher alinhamento
- Todos os controles conectados a `handleUpdateWireframe()`
- Persistência automática ao salvar

## 🎨 Componentes Reutilizados

- ✅ `PaddingPicker`: Componente existente para configurar padding
- ✅ `AlignmentPicker`: Componente existente para alinhamento visual

## 💾 Como os Dados São Armazenados

```typescript
// Exemplo de wireframe com auto-layout ativado:
{
  id: "wf1",
  name: "Home Screen",
  width: 375,
  height: 812,
  layoutMode: "vertical",           // Ativar auto-layout
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  itemSpacing: 12,
  justifyContent: "flex-start",
  alignItems: "center",
  elements: [...]
}
```

## 🚀 Como Usar

### Para Desenvolvedores:

1. **Verificar se auto-layout está ativado**:
   ```typescript
   if (wireframe.layoutMode && wireframe.layoutMode !== 'none') {
     // Auto-layout está ativado
   }
   ```

2. **Usar o hook para recalcular layout**:
   ```typescript
   const { calculateAutoLayout } = useWireframeAutoLayout();
   const elementsWithLayout = calculateAutoLayout(wireframe, config);
   ```

### Para Usuários:

1. Abra as **Propriedades** da tela (nenhum elemento selecionado)
2. Procure a seção **Auto Layout**
3. Clique em **Horizontal** ou **Vertical**
4. Ajuste:
   - **Espaçamento entre elementos**
   - **Padding** (espaço interno)
   - **Alinhamento** (grid 3x3)

## 🎯 Comportamentos

✅ **O que o Auto Layout faz:**
- Organiza elementos automaticamente
- Evita sobreposição de elementos
- Mantém espaçamento uniforme
- Respeita configurações de padding e alinhamento

❌ **O que o Auto Layout NÃO faz:**
- Modifica o tamanho do wireframe
- Modifica a resolução/dimensões do projeto
- Altera o tamanho individual dos elementos
- Interfere com auto-layout de frames individuais

## 📝 Documentação

Veja `WIREFRAME_AUTOLAYOUT_FEATURE.md` para documentação detalhada com exemplos e casos de uso.

## 🔗 Dependências

- Nenhuma dependência externa nova
- Utiliza componentes UI existentes (`PaddingPicker`, `AlignmentPicker`)
- Integra-se com `WireframeCanvas` existente

## ✨ Recursos Relacionados

- ✅ Funciona com **Undo/Redo** (Ctrl+Z / Ctrl+Shift+Z)
- ✅ Funciona com **Drag & Drop** (move o wireframe inteiro)
- ✅ Funciona com **Grid Overlay**
- ✅ Funciona com **Raio X**
- ✅ Funciona com **Zoom**

## 🧪 Teste Recomendado

1. Crie um novo wireframe
2. Adicione 3-5 elementos (retângulos, textos)
3. Ative Auto Layout Vertical
4. Configure:
   - Item Spacing: 16px
   - Padding: 16px (todos os lados)
   - Align Items: center
5. Observe os elementos se reorganizarem

## 📌 Próximos Passos (Sugestões)

- [ ] Visualização em tempo real de mudanças (já implementado)
- [ ] Constraints/restricções de tamanho por elemento
- [ ] Auto-resize baseado em conteúdo
- [ ] Templates de layout pré-configurados
- [ ] Atalhos de teclado para alternar modos
