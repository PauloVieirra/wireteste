# Teste - Wireframe Auto Layout

## Instruções para Teste

### 1. Criar Wireframe com Elementos
- Crie um novo wireframe
- Adicione 3-4 retângulos em posições diferentes
- Cada retângulo deve ter tamanho diferente (ex: 100x100, 150x80, 120x120)

### 2. Ativar Auto Layout Horizontal
1. No painel de propriedades do wireframe, localize a seção "Auto Layout"
2. Clique no ícone de "Layers" (primeiro botão) para ativar auto-layout
3. Clique na seta para direita (→) para ativar "Horizontal"

**Resultado Esperado:**
- Os retângulos devem se alinhar horizontalmente
- Eles devem manter suas alturas
- Deve haver espaço entre eles (se houver itemSpacing definido)

### 3. Ativar Auto Layout Vertical
1. Clique na seta para baixo (↓) para ativar "Vertical"

**Resultado Esperado:**
- Os retângulos devem se alinhar verticalmente
- Eles devem manter suas larguras
- Deve haver espaço entre eles (se houver itemSpacing definido)

### 4. Configurar Padding
- Defina `Padding Top`, `Padding Left`, etc. para adicionar espaço ao redor
- Os elementos devem se reorganizar, respeitando o padding

### 5. Configurar Espaçamento
- Defina `Item Spacing` para adicionar espaço entre elementos
- Os elementos devem se redistribuir horizontalmente/verticalmente

### 6. Desativar Auto Layout
- Clique no ícone de "Layers" novamente para desativar
- Os elementos devem voltar às suas posições originais (salvas no undo history)

## Problemas Conhecidos

Se os elementos **desaparecerem**:
1. Abra o Dev Tools (F12)
2. Vá para a aba Console
3. Procure por erros
4. Verifique se o wireframe tem `width` e `height` definidos

Se os elementos **não se movem**:
1. Verifique se `layoutMode` é `'horizontal'` ou `'vertical'` (não `'none'`)
2. Verifique se há elementos suficientes (mínimo 2 para ver diferença)
3. Verifique se o elemento está sendo renderizado com as novas posições

## Changelog

- **Correção Crítica**: Bug where elements were being filtered by `child` property
- **Solução**: Todos os elementos do wireframe agora são layout-ados quando auto-layout está ativo
- **Suporte**: Frames com filhos podem ser reorganizados como um bloco no wireframe
