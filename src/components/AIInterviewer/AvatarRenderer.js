import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useAnimations,
  PerspectiveCamera,
  CameraShake,
  useTexture,
  Plane
} from '@react-three/drei';
import * as THREE from 'three';

// Default avatar URL - using local models to avoid network issues
const DEFAULT_AVATAR_URL = '/avatars/default-avatar.glb';

// Environment presets for different moods
const ENVIRONMENT_PRESETS = {
  neutral: 'city',
  happy: 'sunset',
  thinking: 'dawn',
  listening: 'night'
};

/**
 * Model error boundary component
 */
function ModelErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <Html center>
        <div style={{ color: 'red', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
          Failed to load 3D model
        </div>
      </Html>
    );
  }
  
  return children;
}

/**
 * Viseme mapping for lip sync
 * Maps phoneme types to morph target indices or names
 */
const VISEME_MAPPING = {
  'sil': 'mouthClose',
  'PP': 'mouthPress',
  'FF': 'mouthPress',
  'TH': 'mouthTeeth',
  'DD': 'mouthOpen',
  'kk': 'mouthTeeth',
  'CH': 'mouthTeeth',
  'SS': 'mouthTeeth',
  'nn': 'mouthOpen',
  'RR': 'mouthRound',
  'aa': 'mouthOpen',
  'E': 'mouthSmile',
  'I': 'mouthSmile',
  'O': 'mouthRound',
  'U': 'mouthRound'
};

/**
 * Avatar model component that handles animations and expressions
 */
function Avatar({ avatarUrl, visemeData, emotion, appearance, position = [0, -1, 0] }) {
  // All refs and state must be declared at the top level
  const group = useRef();
  const [modelError, setModelError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [model, setModel] = useState(null);
  const mixerRef = useRef(null);
  const { camera } = useThree();
  const animationActionRef = useRef(null);
  const currentAnimationRef = useRef('idle');
  
  // Load the model using useGLTF with preloading
  const { scene, animations } = useGLTF(avatarUrl || DEFAULT_AVATAR_URL);
  
  // Get animations from the model
  const { actions, names: animationNames } = useAnimations(animations, group);
  
  // Set up the model and mixer on mount or when the model URL changes
  useEffect(() => {
    try {
      if (!scene) {
        setModelError(true);
        setErrorMessage('Failed to load 3D model. The model file may be missing or corrupted.');
        return;
      }
      
      // Clone the scene to avoid modifying the cached original
      const clonedScene = scene.clone();
      
      // Set up animation mixer
      mixerRef.current = new THREE.AnimationMixer(clonedScene);
      
      // Set the model
      setModel(clonedScene);
      setModelError(false);
      setErrorMessage('');
      
      // Debug available animations
      console.log('Available animations:', animationNames);
      
      // Debug available morph targets and materials
      const head = clonedScene.getObjectByName('Head');
      if (head) {
        if (head.morphTargetDictionary) {
          console.log('Available morph targets:', Object.keys(head.morphTargetDictionary));
        }
        if (head.material) {
          console.log('Available material properties:', Object.keys(head.material));
        }
      }

      // Apply appearance customization
      if (appearance) {
        clonedScene.traverse((node) => {
          if (node.isMesh) {
            // Apply skin tone
            if (appearance.skinTone !== 'default' && node.name.includes('Skin')) {
              const skinColors = {
                light: new THREE.Color(0xffe0bd),
                medium: new THREE.Color(0xd1a3a4),
                dark: new THREE.Color(0x8d5524)
              };
              if (node.material) {
                node.material.color = skinColors[appearance.skinTone] || skinColors.medium;
              }
            }

            // Apply hair style
            if (appearance.hairStyle !== 'default' && node.name.includes('Hair')) {
              const hairStyles = {
                short: { scale: new THREE.Vector3(1, 0.5, 1) },
                long: { scale: new THREE.Vector3(1, 1.5, 1) },
                tied: { scale: new THREE.Vector3(0.8, 1.2, 0.8) }
              };
              const style = hairStyles[appearance.hairStyle];
              if (style) {
                node.scale.copy(style.scale);
              }
            }

            // Apply outfit
            if (appearance.outfit !== 'default' && node.name.includes('Outfit')) {
              const outfitColors = {
                business: new THREE.Color(0x2c3e50),
                casual: new THREE.Color(0x3498db),
                professional: new THREE.Color(0x34495e)
              };
              if (node.material) {
                node.material.color = outfitColors[appearance.outfit] || outfitColors.casual;
              }
            }
          }
        });
      }
      
      // Play idle animation if available
      if (actions && actions.idle) {
        actions.idle.reset().fadeIn(0.5).play();
        animationActionRef.current = actions.idle;
        currentAnimationRef.current = 'idle';
      } else if (animationNames.length > 0) {
        // If no idle animation, play the first available animation
        const firstAnim = animationNames[0];
        actions[firstAnim].reset().fadeIn(0.5).play();
        animationActionRef.current = actions[firstAnim];
        currentAnimationRef.current = firstAnim;
      }
    } catch (error) {
      console.error('Error setting up model:', error);
      setModelError(true);
      setErrorMessage(`Error processing 3D model: ${error.message}`);
    }
    
    // Cleanup function to dispose of resources when component unmounts or scene changes
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [scene, avatarUrl, actions, animationNames, appearance]);
  
  // Set up facial expressions based on emotion
  useEffect(() => {
    if (!model) return;
    
    // Find the head/face mesh to apply expressions
    const head = model.getObjectByName('Head');
    if (!head || !head.morphTargetInfluences) return;
    
    // Reset any previous expressions
    head.morphTargetInfluences = head.morphTargetInfluences.map(() => 0);
    
    // Change animation based on emotion
    const targetAnimation = emotion === 'neutral' ? 'idle' :
                           emotion === 'happy' ? 'happy' :
                           emotion === 'thinking' ? 'thinking' :
                           emotion === 'listening' ? 'listening' : 'idle';
    
    // Only change animation if it's different from current and exists
    if (actions[targetAnimation] && currentAnimationRef.current !== targetAnimation) {
      if (animationActionRef.current) {
        animationActionRef.current.fadeOut(0.5);
      }
      actions[targetAnimation].reset().fadeIn(0.5).play();
      animationActionRef.current = actions[targetAnimation];
      currentAnimationRef.current = targetAnimation;
    }
    
    // Apply emotion-based expressions
    switch(emotion) {
      case 'happy':
        if (head.morphTargetDictionary?.smile) {
          head.morphTargetInfluences[head.morphTargetDictionary.smile] = 1;
        }
        if (head.morphTargetDictionary?.eyesClosed) {
          head.morphTargetInfluences[head.morphTargetDictionary.eyesClosed] = 0.3;
        }
        break;
      case 'thinking':
        if (head.morphTargetDictionary?.browRaise) {
          head.morphTargetInfluences[head.morphTargetDictionary.browRaise] = 1;
        }
        if (head.morphTargetDictionary?.eyesSquint) {
          head.morphTargetInfluences[head.morphTargetDictionary.eyesSquint] = 0.5;
        }
        break;
      case 'interested':
        if (head.morphTargetDictionary?.eyesWide) {
          head.morphTargetInfluences[head.morphTargetDictionary.eyesWide] = 0.7;
        }
        if (head.morphTargetDictionary?.browRaise) {
          head.morphTargetInfluences[head.morphTargetDictionary.browRaise] = 0.3;
        }
        break;
      case 'listening':
        if (head.morphTargetDictionary?.eyesWide) {
          head.morphTargetInfluences[head.morphTargetDictionary.eyesWide] = 0.3;
        }
        if (head.morphTargetDictionary?.browRaise) {
          head.morphTargetInfluences[head.morphTargetDictionary.browRaise] = 0.2;
        }
        break;
      default:
        // Neutral expression - slight random blinking
        if (head.morphTargetDictionary?.eyesBlink && Math.random() > 0.995) {
          head.morphTargetInfluences[head.morphTargetDictionary.eyesBlink] = 1;
          setTimeout(() => {
            if (head && head.morphTargetInfluences && head.morphTargetDictionary?.eyesBlink) {
              head.morphTargetInfluences[head.morphTargetDictionary.eyesBlink] = 0;
            }
          }, 150);
        }
        break;
    }
    
    console.log('Setting avatar emotion:', emotion);
  }, [emotion, model, actions]);
  
  // Handle lip sync based on viseme data
  useEffect(() => {
    if (!model || !visemeData) return;
    
    // Find the head mesh to apply visemes
    const head = model.getObjectByName('Head');
    if (!head || !head.morphTargetInfluences || !head.morphTargetDictionary) return;
    
    // Reset mouth shape for lip sync (but keep other expressions)
    const mouthMorphs = ['mouthOpen', 'mouthClose', 'mouthSmile', 'mouthRound', 'mouthPress', 'mouthTeeth'];
    mouthMorphs.forEach(morphName => {
      if (head.morphTargetDictionary[morphName] !== undefined) {
        head.morphTargetInfluences[head.morphTargetDictionary[morphName]] = 0;
      }
    });
    
    if (visemeData.length > 0) {
      // Find the current viseme based on time
      const now = Date.now() / 1000; // Current time in seconds
      const currentVisemes = visemeData.flatMap(word => word.visemes)
        .filter(viseme => viseme.start <= now && viseme.end >= now);
      
      if (currentVisemes.length > 0) {
        // Apply the current viseme
        const currentViseme = currentVisemes[0];
        const morphName = VISEME_MAPPING[currentViseme.type] || 'mouthOpen';
        
        if (head.morphTargetDictionary[morphName] !== undefined) {
          // Apply with intensity based on the viseme type
          const intensity = currentViseme.type === 'sil' ? 0.1 : 0.8;
          head.morphTargetInfluences[head.morphTargetDictionary[morphName]] = intensity;
        }
      }
      
      console.log('Updating avatar lip sync with viseme data');
    } else {
      // Close mouth when not speaking
      if (head.morphTargetDictionary.mouthClose !== undefined) {
        head.morphTargetInfluences[head.morphTargetDictionary.mouthClose] = 0.2;
      }
    }
  }, [visemeData, model]);
  
  // Animation loop
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Add subtle idle animation to the whole model
    if (group.current) {
      // Subtle breathing motion
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.01;
      
      // Subtle swaying
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        Math.sin(state.clock.elapsedTime / 3) * 0.05,
        0.01
      );
    }
  });
  
  // Render function with conditional content
  let content;
  if (modelError) {
    content = (
      <Html center>
        <div style={{
          color: 'red',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          maxWidth: '300px',
          textAlign: 'center'
        }}>
          <div>Failed to load or process 3D model</div>
          {errorMessage && (
            <div style={{ fontSize: '0.8em', marginTop: '8px', opacity: 0.8 }}>
              {errorMessage}
            </div>
          )}
        </div>
      </Html>
    );
  } else if (!model) {
    content = (
      <Html center>
        <div style={{
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px'
        }}>
          Loading model...
        </div>
      </Html>
    );
  } else {
    content = (
      <group ref={group} position={position} dispose={null}>
        <primitive object={model} scale={1.5} />
      </group>
    );
  }
  
  // Always return something, no early returns
  return content;
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <Html center>
      <div style={{
        padding: '10px 20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '4px',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading 3D avatar...
      </div>
    </Html>
  );
}

/**
 * Main AvatarRenderer component
 */
const AvatarRenderer = ({ avatarUrl, visemeData, emotion, appearance }) => {
  const [error, setError] = useState(null);
  
  // Error boundary for 3D rendering
  useEffect(() => {
    const handleError = (event) => {
      console.error('WebGL error:', event);
      setError('Failed to render 3D avatar. WebGL may not be supported in your browser.');
    };
    
    window.addEventListener('webglcontextlost', handleError);
    return () => window.removeEventListener('webglcontextlost', handleError);
  }, []);
  
  // Preload models to avoid issues
  useEffect(() => {
    // Preload all avatar models
    const preloadModels = async () => {
      try {
        // Preload the default model
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Continue even if there's an error
          img.src = DEFAULT_AVATAR_URL;
        });
        
        // Preload the specified model if different
        if (avatarUrl && avatarUrl !== DEFAULT_AVATAR_URL) {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = avatarUrl;
          });
        }
      } catch (err) {
        console.warn('Error preloading models:', err);
      }
    };
    
    preloadModels();
  }, [avatarUrl]);
  
  // Determine content based on state after all hooks are called
  let content;
  if (error) {
    content = (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
        color: 'red',
        borderRadius: '8px'
      }}>
        {error}
      </div>
    );
  } else {
    content = (
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        }}
        style={{
          backgroundColor: '#111',
          borderRadius: '8px'
        }}
        dpr={[1, 2]} // Responsive pixel ratio for better performance
      >
        {/* Advanced camera setup */}
        <PerspectiveCamera
          makeDefault
          position={[0, 1.6, 2.5]}
          fov={45}
          near={0.1}
          far={100}
        >
          {/* Subtle camera shake for more lifelike feel */}
          <CameraShake
            maxYaw={0.01}
            maxPitch={0.01}
            maxRoll={0.01}
            yawFrequency={0.5}
            pitchFrequency={0.4}
            rollFrequency={0.3}
          />
        </PerspectiveCamera>
        
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <spotLight
          position={[-5, 5, 5]}
          intensity={0.5}
          angle={0.5}
          penumbra={1}
          castShadow
        />
        
        {/* Dynamic environment based on emotion */}
        <Environment preset={ENVIRONMENT_PRESETS[emotion] || 'city'} />
        
        {/* Avatar with error boundary and suspense */}
        <ModelErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Avatar
              avatarUrl={avatarUrl}
              visemeData={visemeData}
              emotion={emotion}
              appearance={appearance}
            />
          </Suspense>
        </ModelErrorBoundary>
        
        {/* Enhanced ground/shadow */}
        <ContactShadows
          opacity={0.6}
          scale={10}
          blur={3}
          far={10}
          resolution={256}
          color="#000000"
          position={[0, -1.5, 0]}
        />
        
        {/* Reflective floor plane */}
        <Plane
          args={[10, 10]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.5, 0]}
        >
          <meshStandardMaterial
            color="#111"
            metalness={0.8}
            roughness={0.4}
            envMapIntensity={0.5}
          />
        </Plane>
        
        {/* Camera controls - enabled in all environments for better user experience */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={2}
          maxDistance={5}
          target={[0, 1, 0]}
        />
      </Canvas>
    );
  }
  
  // Always return a container with the determined content
  return (
    <div className="avatar-container" style={{
      position: 'relative',
      width: '100%',
      height: '500px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {content}
    </div>
  );
};

export default AvatarRenderer;