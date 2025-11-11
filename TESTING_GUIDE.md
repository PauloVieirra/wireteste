# Guia de Teste - FillContainer Border Fix

## 🧪 Testes Recomendados

### Teste 1: FillContainer Horizontal - Mobile
**Passos:**
1. Criar novo projeto com resolução **Mobile (375×812)**
2. Adicionar novo **Frame** (borderWidth padrão = 2px)
3. Adicionar um **Rectangle** dentro do frame
4. Selecionar o rectangle
5. Clicar em **"Fill Horizontally"**

**Resultado Esperado:**
- ✅ Rectangle preenche horizontalmente
- ✅ Bordas esquerda e direita do frame **PERMANECEM VISÍVEIS**
- ✅ Rectangle não sobrepõe as bordas
- ✅ Posição X deve ser 2 (borderWidth)
- ✅ Largura deve ser 371 (375 - 2 - 2)

### Teste 2: FillContainer Horizontal - Tablet
**Passos:**
1. Criar novo projeto com resolução **Tablet (768×1024)**
2. Adicionar novo **Frame** com borderWidth = 2
3. Adicionar um **Rectangle** dentro do frame
4. Selecionar o rectangle
5. Clicar em **"Fill Horizontally"**

**Resultado Esperado:**
- ✅ Rectangle preenche horizontalmente
- ✅ Bordas esquerda e direita do frame **VISÍVEIS**
- ✅ Posição X = 2, Largura = 764 (768 - 2 - 2)

### Teste 3: FillContainer Horizontal - Desktop
**Passos:**
1. Criar novo projeto com resolução **Desktop (1440×900)**
2. Adicionar novo **Frame** com borderWidth = 2
3. Adicionar um **Rectangle** dentro do frame
4. Selecionar o rectangle
5. Clicar em **"Fill Horizontally"**

**Resultado Esperado:**
- ✅ Rectangle preenche horizontalmente
- ✅ Bordas esquerda e direita do frame **VISÍVEIS**
- ✅ Posição X = 2, Largura = 1436 (1440 - 2 - 2)

### Teste 4: FillContainer Vertical
**Passos:**
1. Criar novo projeto (qualquer resolução)
2. Adicionar novo **Frame** com borderWidth = 2
3. Adicionar um **Rectangle** dentro do frame
4. Selecionar o rectangle
5. Clicar em **"Fill Vertically"**

**Resultado Esperado:**
- ✅ Rectangle preenche verticalmente
- ✅ Bordas superior e inferior do frame **VISÍVEIS**
- ✅ Rectangle não sobrepõe as bordas

### Teste 5: FillContainer com Padding
**Passos:**
1. Criar novo projeto (qualquer resolução)
2. Adicionar novo **Frame** com:
   - borderWidth = 2
   - padding = 16
3. Adicionar um **Rectangle** dentro do frame
4. Selecionar o rectangle
5. Clicar em **"Fill Horizontally"** e **"Fill Vertically"**

**Resultado Esperado:**
- ✅ Rectangle respeita **AMBOS** padding e borderWidth
- ✅ Espaço interior = 16px (padding) + 2px (border) = 18px total de cada lado
- ✅ Bordas permanecem visíveis
- ✅ Espaço de padding é mantido

### Teste 6: Drag-and-Drop com Bordas
**Passos:**
1. Criar novo projeto (mobile)
2. Adicionar novo **Frame** com borderWidth = 2
3. Adicionar um **Rectangle** dentro do frame
4. **Arrastar** o rectangle até a extrema esquerda

**Resultado Esperado:**
- ✅ Rectangle **PARA** quando chega próximo à borda
- ✅ Rectangle não consegue sair do frame
- ✅ Borda esquerda **PERMANECE VISÍVEL**

### Teste 7: Redimensionamento com Bordas
**Passos:**
1. Criar novo projeto (tablet)
2. Adicionar novo **Frame** com borderWidth = 2
3. Adicionar um **Rectangle** pequeno dentro do frame (ex: 100×100)
4. **Arrastar** a alça de redimensionamento (canto inferior direito) para aumentar

**Resultado Esperado:**
- ✅ Rectangle aumenta de tamanho
- ✅ Rectangle **PARA** de crescer quando chega próximo à borda
- ✅ Borda direita **PERMANECE VISÍVEL**
- ✅ Rectangle não consegue ocupar o espaço da borda

### Teste 8: Frame Sem BorderWidth
**Passos:**
1. Criar novo projeto
2. Adicionar novo **Frame** com borderWidth = 0
3. Adicionar um **Rectangle** dentro do frame
4. Selecionar o rectangle
5. Clicar em **"Fill Horizontally"**

**Resultado Esperado:**
- ✅ Rectangle preenche a largura toda (sem reservar espaço para borda)
- ✅ Comportamento normal mantido para frames sem borda

### Teste 9: BorderWidth Customizado
**Passos:**
1. Criar novo projeto (mobile)
2. Adicionar novo **Frame**
3. Editar o frame e definir **borderWidth = 4** (ou outro valor)
4. Adicionar um **Rectangle** dentro do frame
5. Selecionar o rectangle
6. Clicar em **"Fill Horizontally"**

**Resultado Esperado:**
- ✅ Rectangle respeita o borderWidth customizado (4px)
- ✅ Posição X = 4, Largura = 367 (375 - 4 - 4)
- ✅ Bordas permanecem visíveis

### Teste 10: Múltiplos Elementos
**Passos:**
1. Criar novo projeto (desktop)
2. Adicionar novo **Frame** com borderWidth = 2 e padding = 16
3. Adicionar **3 Rectangles** dentro do frame
4. Selecionar cada um e aplicar **"Fill Horizontally"**

**Resultado Esperado:**
- ✅ Todos os 3 rectangles respeitam as bordas
- ✅ Todos possuem a mesma posição X e largura
- ✅ Nenhum sobrepõe as bordas do frame

## 📊 Valores Esperados por Resolução

### Mobile (375×812)
```
Com borderWidth=2, padding=0:
- x = 2
- width = 371
- y (fill vertical) = 2
- height (fill vertical) = 808
```

### Tablet (768×1024)
```
Com borderWidth=2, padding=16:
- x = 18 (16 + 2)
- width = 732 (768 - 16*2 - 2*2)
- y (fill vertical) = 18
- height (fill vertical) = 988 (1024 - 16*2 - 2*2)
```

### Desktop (1440×900)
```
Com borderWidth=2, padding=0:
- x = 2
- width = 1436
- y (fill vertical) = 2
- height (fill vertical) = 896
```

## 🐛 Se Algo Não Funcionar

### Checklist de Diagnóstico
- [ ] Frame tem `borderWidth > 0`?
- [ ] Elemento está dentro do frame como `child`?
- [ ] Elemento foi selecionado corretamente?
- [ ] Botão "Fill" estava visível no painel de propriedades?
- [ ] Projeto foi salvo após as mudanças?
- [ ] Página foi recarregada para carregar novo código?

### Logs para Debug
Abrir DevTools (F12) e buscar por:
```javascript
console.debug('[WireframeEditor] fillContainer')
console.debug('[WireframeEditor] handleElementTransformEnd')
```

## ✨ Conclusão do Teste
Se todos os 10 testes passarem, a correção foi implementada com sucesso! 🎉
