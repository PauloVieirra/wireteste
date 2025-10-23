import React, { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment, ContactShadows } from '@react-three/drei';
import { WireframeCanvas } from './WireframeCanvas';
import * as THREE from 'three';
import Konva from 'konva';

// --- TYPE DEFINITIONS ---
interface WireframeElement { id: string; type: string; x: number; y: number; width: number; height: number; text?: string; backgroundColor?: string; textLevel?: any; fontSize?: number; textColor?: string; textAlign?: any; zIndex?: number; borderWidth?: number; borderColor?: string; iconName?: string; imageSrc?: string; navigationTarget?: string; parentId?: string; }
interface Wireframe { id: string; name: string; elements: WireframeElement[]; width?: number; height?: number; }
interface Project { id: string; name: string; resolution: 'mobile' | 'tablet' | 'desktop' | 'custom'; width?: number; height?: number; wireframes: Wireframe[]; }

interface MockupViewProps {
  project: Project;
  activeWireframeId: string;
  activeMockup: string;
}

// --- HELPER FUNCTIONS ---
const getFontSize = (element: WireframeElement, resolution: Project['resolution']) => {
  if (element.fontSize) return element.fontSize;
  const fontSizes = {
    desktop: { h1: 40, h2: 32, h3: 28, h4: 24, h5: 20, h6: 16, p: 16 },
    tablet:  { h1: 32, h2: 28, h3: 24, h4: 20, h5: 18, h6: 16, p: 15 },
    mobile:  { h1: 28, h2: 24, h3: 20, h4: 18, h5: 16, h6: 14, p: 14 },
    custom:  { h1: 40, h2: 32, h3: 28, h4: 24, h5: 20, h6: 16, p: 16 },
  };
  const res = resolution || 'desktop';
  const level = element.textLevel || 'p';
  return fontSizes[res][level] || fontSizes[res].p;
};

const getCanvasDimensions = (project: Project, wireframeId: string) => {
    if (!project || !wireframeId) return { width: 1920, height: 1080 };
    const wireframe = project.wireframes.find(w => w.id === wireframeId);
    if (wireframe && wireframe.width && wireframe.height) return { width: wireframe.width, height: wireframe.height };
    switch (project.resolution) {
      case 'mobile': return { width: 375, height: 812 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1440, height: 900 };
      default: return { width: 1920, height: 1080 };
    }
};

// --- INTERACTIVE WIREFRAME COMPONENT ---
const InteractiveWireframe = ({ project, wireframe, dimensions, onNavigate, zoom, onPointerEnter, onPointerLeave }: { project: Project, wireframe: Wireframe, dimensions: {width: number, height: number}, onNavigate: (id: string | null) => void, zoom: number, onPointerEnter: () => void, onPointerLeave: () => void }) => {
  const stageRef = useRef<Konva.Stage>(null);

  return (
    <div style={{
        width: dimensions.width * zoom,
        height: dimensions.height * zoom,
        transformOrigin: 'top left',
    }}
    className="select-none bg-white"
    onPointerDown={(e) => e.stopPropagation()}
    onPointerEnter={onPointerEnter}
    onPointerLeave={onPointerLeave}
    >
        <WireframeCanvas
            ref={stageRef}
            project={project}
            wireframe={wireframe}
            zoom={zoom} // Pass zoom to Konva
            selectedElementId={null}
            onSelectElement={onNavigate}
            onUpdateElement={() => {}}
            onElementDragEnd={() => {}}
            onElementTransformEnd={() => {}}
            canvasDimensions={dimensions}
            gridConfig={{ enabled: false, columns: 12, gap: 16, margin: 24, color: 'red', opacity: 0.1 }}
            getFontSize={(el) => getFontSize(el, project.resolution)}
            getFontFamilyCSS={() => 'Inter'}
            getElementMinimumSize={() => 5}
            onCanvasMouseDown={() => {}}
            isReadOnly={true}
        />
    </div>
  )
}

// --- LAPTOP MODEL SCENE (Still needs console log from user to fix) ---
function LaptopModel({ project, activeWireframeId }: MockupViewProps) {
  const { scene, nodes, materials } = useGLTF('/laptop.glb');
  useEffect(() => {
    console.log('--- Laptop Model Debug ---\nNodes:', nodes, '\nMaterials:', materials);
  }, [scene, nodes, materials]);
  return <primitive object={scene} />;
}

// --- MACBOOK MODEL SCENE ---
function MacbookModel({ project, activeWireframeId, activeMockup, scrollableContainerRef, setIsScreenHovered }: MockupViewProps & { scrollableContainerRef: React.RefObject<HTMLDivElement>, setIsScreenHovered: (hovered: boolean) => void }) {
  const group = useRef<THREE.Group>(null!)
  const { nodes, materials } = useGLTF('/mac-draco.glb')

  const [currentWireframeId, setCurrentWireframeId] = useState(activeWireframeId);
  useEffect(() => {
    setCurrentWireframeId(activeWireframeId);
  }, [activeWireframeId]);

  const handleNavigate = (elementId: string | null) => {
    if (!elementId) return;
    const wireframe = project.wireframes.find(w => w.id === currentWireframeId);
    const element = wireframe?.elements.find(e => e.id === elementId);
    if (element?.navigationTarget && element.navigationTarget !== '__FINISH_TEST__') {
      setCurrentWireframeId(element.navigationTarget);
    }
  };

  const currentWireframe = project.wireframes.find(w => w.id === currentWireframeId);
  const canvasDimensions = getCanvasDimensions(project, currentWireframeId);

  const fixedWidth = 340;
  const fixedHeight = 224;
  const qualityFactor = 2;
  const renderWidth = fixedWidth * qualityFactor;

  const scale = canvasDimensions.width > 0 ? renderWidth / canvasDimensions.width : 1;

  return (
    <group ref={group} dispose={null}>
      <group rotation-x={-0.425} position={[0, -0.04, 1.5]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow receiveShadow material={materials.aluminium} geometry={nodes['Cube008'].geometry} />
          <mesh castShadow receiveShadow material={materials['matte.001']} geometry={nodes['Cube008_1'].geometry} />
          <mesh castShadow receiveShadow geometry={nodes['Cube008_2'].geometry}>
            <Html rotation-x={-Math.PI / 2} position={[0.04, 0.08, -0.24]} transform occlude>
                <style>{`
                    .scroller::-webkit-scrollbar { width: 4px; }
                    .scroller::-webkit-scrollbar-track { background: transparent; }
                    .scroller::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 8px; }
                    .scroller::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
                `}</style>
                <div
                    ref={scrollableContainerRef}
                    className="scroller"
                    style={{
                        width: `${fixedWidth}px`,
                        height: `${fixedHeight}px`,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        borderRadius: '1px',
                    }}
                >
                  <div style={{ transform: `scale(${1 / qualityFactor})`, transformOrigin: 'top left', width: `${renderWidth}px` }}>
                    {currentWireframe && (
                          <InteractiveWireframe
                              project={project}
                              wireframe={currentWireframe}
                              dimensions={canvasDimensions}
                              onNavigate={handleNavigate}
                              zoom={scale}
                              onPointerEnter={() => setIsScreenHovered(true)}
                              onPointerLeave={() => setIsScreenHovered(false)}
                          />
                      )}
                  </div>
                </div>
            </Html>
          </mesh>
        </group>
      </group>
    </group>
  )
}

// --- MAIN VIEW COMPONENT ---
const MockupView = ({ project, activeWireframeId, activeMockup }: MockupViewProps) => {
  const [isScreenHovered, setIsScreenHovered] = useState(false);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (isScreenHovered && scrollableContainerRef.current) {
      const container = scrollableContainerRef.current;
      const { scrollHeight, clientHeight } = container;
      
      const newScrollTop = container.scrollTop + e.deltaY;

      // Clamp the new scroll top value
      const clampedScrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight));

      container.scrollTop = clampedScrollTop;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#303030' }} onWheel={handleWheel}>
      <Canvas shadows camera={{ position: [0, 0, 18], fov: 50 }} frameloop="demand">
        <Suspense fallback={null}>
          {activeMockup === 'laptop' && <LaptopModel project={project} activeWireframeId={activeWireframeId} activeMockup={activeMockup} />}
          {activeMockup === 'macbook' && (
            <group position={[0, 1.5, 0]} scale={1.5}>
                <MacbookModel
                    project={project}
                    activeWireframeId={activeWireframeId}
                    activeMockup={activeMockup}
                    scrollableContainerRef={scrollableContainerRef}
                    setIsScreenHovered={setIsScreenHovered}
                />
            </group>
          )}
          <Environment preset="city" />
        </Suspense>
        <ContactShadows position={[0, -1, 0]} scale={20} blur={2} far={4.5} />
        <OrbitControls
            target={[0, 5.5, 0]}
            enablePan={true}
            enableZoom={!isScreenHovered}
            minDistance={12}
            maxDistance={12}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
};

export default MockupView;