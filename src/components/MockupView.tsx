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
const InteractiveWireframe = ({ project, wireframe, dimensions, onNavigate, scale }: { project: Project, wireframe: Wireframe, dimensions: {width: number, height: number}, onNavigate: (id: string | null) => void, scale: number }) => {
  const stageRef = useRef<Konva.Stage>(null);

  return (
    <div style={{
        width: dimensions.width,
        height: dimensions.height,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
    }} 
    className="select-none bg-white" 
    onPointerDown={(e) => e.stopPropagation()}
    >
        <WireframeCanvas
            ref={stageRef}
            project={project}
            wireframe={wireframe}
            zoom={1} // Zoom is handled by the CSS scale now
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
function MacbookModel({ project, activeWireframeId }: MockupViewProps) {
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
  const fixedHeight = 218;
  const scale = canvasDimensions.width > 0 ? fixedWidth / canvasDimensions.width : 1;

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if(group.current) {
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, Math.cos(t / 2) / 20 + 0.25, 0.1)
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.sin(t / 4) / 20, 0.1)
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, Math.sin(t / 8) / 20, 0.1)
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, (-2 + Math.sin(t / 2)) / 2, 0.1)
    }
  })

  return (
    <group ref={group} dispose={null}> 
      <group rotation-x={-0.425} position={[0, -0.04, 0.41]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow receiveShadow material={materials.aluminium} geometry={nodes['Cube008'].geometry} />
          <mesh castShadow receiveShadow material={materials['matte.001']} geometry={nodes['Cube008_1'].geometry} />
          <mesh castShadow receiveShadow geometry={nodes['Cube008_2'].geometry}>
            <Html rotation-x={-Math.PI / 2} position={[0.04, 0.05, -0.40]} transform occlude>
                <style>{`
                    .scroller::-webkit-scrollbar { width: 5px; }
                    .scroller::-webkit-scrollbar-track { background: transparent; }
                    .scroller::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 10px; }
                    .scroller::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.5); }
                `}</style>
                <div 
                    className="scroller"
                    style={{
                        width: `${fixedWidth}px`,
                        height: `${fixedHeight}px`,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        borderRadius: '2px',
                    }}
                >
                  {currentWireframe && (
                        <InteractiveWireframe project={project} wireframe={currentWireframe} dimensions={canvasDimensions} onNavigate={handleNavigate} scale={scale} />
                    )}
                </div>
            </Html>
          </mesh>
        </group>
      </group>
      <mesh castShadow receiveShadow material={materials.keys} geometry={nodes.keyboard.geometry} position={[1.79, 0, 3.45]} />
      <group position={[0, -0.1, 3.39]}>
        <mesh castShadow receiveShadow material={materials.aluminium} geometry={nodes['Cube002'].geometry} />
        <mesh castShadow receiveShadow material={materials.trackpad} geometry={nodes['Cube002_1'].geometry} />
      </group>
      <mesh castShadow receiveShadow material={materials.touchbar} geometry={nodes.touchbar.geometry} position={[0, -0.03, 1.2]} />
    </group>
  )
}

// --- MAIN VIEW COMPONENT ---
const MockupView = ({ project, activeWireframeId, activeMockup }: MockupViewProps) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#303030' }}>
      <Canvas shadows camera={{ position: [0, 0, 12], fov: 50 }}>
        <Suspense fallback={null}>
          {activeMockup === 'laptop' && <LaptopModel project={project} activeWireframeId={activeWireframeId} activeMockup={activeMockup} />}
          {activeMockup === 'macbook' && (
            <group rotation={[0, Math.PI, 0]} position={[0, 1, 0]}>
                <MacbookModel project={project} activeWireframeId={activeWireframeId} activeMockup={activeMockup} />
            </group>
          )}
          <Environment preset="city" />
        </Suspense>
        <ContactShadows position={[0, -4.5, 0]} scale={20} blur={2} far={4.5} />
        <OrbitControls enablePan={true} enableZoom={true} minDistance={3} maxDistance={15} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
      </Canvas>
    </div>
  );
};

export default MockupView;