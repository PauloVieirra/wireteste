# Debug - Wireframe Auto Layout Flickering

## O que está acontecendo

Quando você ativa auto-layout, os elementos **piscam rapidamente** e voltam às suas posições originais.

## Como debugar

### 1. Abra o Dev Tools
- Pressione **F12** no navegador
- Vá para aba **Console**
- Se houver muitos logs, vá para **Console Settings** (⚙️ canto superior direito)
- Marque **"Preserve log"** para não limpar os logs durante scrolling

### 2. Reproduza o problema
1. Crie um wireframe novo
2. Adicione 3 retângulos com posições diferentes:
   - Retângulo 1: x=50, y=50, width=100, height=100
   - Retângulo 2: x=200, y=50, width=150, height=80
   - Retângulo 3: x=50, y=200, width=120, height=120

3. Clique no botão "Layers" (Auto Layout) para ativar
4. Clique na seta para direita (→) para ativar "Horizontal"

### 3. Observe os logs no Console

Você verá logs como:

```
[WireframeCanvas] wireframe.elements key: id1:50,50|id2:200,50|id3:50,200
[WireframeCanvas] Rendering wireframe: {id: '...', layoutMode: 'horizontal', elementsCount: 3, ...}
[WireframeCanvas] Calculating layout with mode: horizontal
[AutoLayout Hook] Called with: {wireframeId: '...', layoutMode: 'horizontal', elementsCount: 3}
[AutoLayout Hook] Calculating horizontal layout for 3 elements
[AutoLayout Hook] Result: {elementsCount: 3, firstThreePositions: [...]}
[WireframeCanvas] Layout calculated, new positions: [...]
```

### 4. Procure por sinais de flickering

**Se você ver isso:**
```
[WireframeCanvas] wireframe.elements key: ...OLD...
[WireframeCanvas] wireframe.elements key: ...NEW...  (diferente!)
[WireframeCanvas] wireframe.elements key: ...OLD...  (voltou!)
```

**Isso significa:** Os elementos estão sendo alterados para a posição layout, depois revertidos para a posição original.

**Se você ver isso:**
```
[WireframeCanvas] Calculating layout with mode: horizontal
[AutoLayout Hook] Called with: ...
[AutoLayout Hook] Result: elementsCount: 3, firstThreePositions: [{x: 0, y: 0}, {x: 100, y: 0}, ...]
[WireframeCanvas] Layout calculated, new positions: [{x: 0, y: 0}, {x: 100, y: 0}, ...]
```

E os elementos ainda desaparecerem, então o problema é que as posições calculadas podem estar fora da tela visível.

## Me reporte

Copie e cole aqui:
1. Os logs que aparecem no console
2. Se você vê os retângulos se movendo e voltando, ou desaparecendo completamente
3. As dimensões do wireframe (width/height)

Isso vai me ajudar a identificar exatamente o problema!
