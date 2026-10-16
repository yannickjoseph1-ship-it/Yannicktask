import { Canvas } from '@react-three/fiber';
import { ContactShadows, Edges, OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { ConfigItem, Species, WaterType } from '../lib/types';
import { Cave, Driftwood, LiveRockPile, Ornament, Rock } from './Decor';
import { Fish } from './Fish';
import { Plant } from './Plant';
import { hashString, seeded } from './random';

export interface AquariumSceneProps {
  dimensions: { lengthCm: number; widthCm: number; heightCm: number };
  waterType: WaterType;
  items: ConfigItem[];
  speciesBySlug: Record<string, Species>;
  /** Matériel présent dans la configuration (dérivé du matching) */
  equipment: { heater: boolean; filter: boolean; light: boolean; co2: boolean };
}

const SCALE = 0.1; // 10 cm = 1 unité
const MAX_FISH = 40;
const MAX_PLANTS = 24;

const WATER_COLORS: Record<WaterType, string> = { FRESH: '#3f9fc9', MARINE: '#1e7ed6', BRACKISH: '#5a9d86' };

export function AquariumScene({ dimensions, waterType, items, speciesBySlug, equipment }: AquariumSceneProps) {
  const w = dimensions.lengthCm * SCALE;
  const h = dimensions.heightCm * SCALE;
  const d = dimensions.widthCm * SCALE;
  const waterH = h * 0.9;
  const substrateH = 0.5;

  const hasRootedPlants = items.some((i) => i.kind === 'PLANT' && speciesBySlug[i.refSlug]?.rooted);
  const substrateColor = waterType === 'MARINE' ? '#e8e2d3' : hasRootedPlants ? '#3b2a1a' : '#d9c7a0';

  const content = useMemo(() => {
    const r = seeded(hashString(JSON.stringify(items)) + dimensions.lengthCm);
    const fishes: React.ReactNode[] = [];
    const plants: React.ReactNode[] = [];
    const decor: React.ReactNode[] = [];
    const bounds = { w, h: waterH - substrateH, d };
    const floor = substrateH;
    const spot = (): [number, number, number] => [(r() - 0.5) * (w - 1), floor, (r() - 0.5) * (d - 1)];

    let fishCount = 0;
    let plantCount = 0;
    for (const item of items) {
      const sp = speciesBySlug[item.refSlug];
      if ((item.kind === 'FISH' || item.kind === 'INVERTEBRATE') && sp) {
        for (let i = 0; i < item.quantity && fishCount < MAX_FISH; i++, fishCount++) {
          fishes.push(
            <group key={`${item.refSlug}-${i}`} position={[0, substrateH, 0]}>
              <Fish seed={hashString(item.refSlug) + i} bounds={bounds} sizeCm={sp.adultSizeCm} color={sp.color} bottomDweller={sp.tags.includes('bottom-dweller') || item.kind === 'INVERTEBRATE'} invertebrate={item.kind === 'INVERTEBRATE'} />
            </group>,
          );
        }
      } else if (item.kind === 'PLANT' && sp) {
        for (let i = 0; i < item.quantity && plantCount < MAX_PLANTS; i++, plantCount++) {
          const pos = spot();
          // Les plantes hautes vont vers l'arrière
          if (sp.adultSizeCm > 25) pos[2] = -d / 2 + 0.4 + r() * (d * 0.3);
          plants.push(<Plant key={`${item.refSlug}-${i}`} seed={hashString(item.refSlug) + i * 7} position={pos} heightCm={sp.adultSizeCm} maxHeight={waterH - substrateH} color={sp.color} rooted={sp.rooted} />);
        }
      } else if (item.kind === 'DECOR') {
        for (let i = 0; i < Math.min(item.quantity, 6); i++) {
          const pos = spot();
          const seed = hashString(item.refSlug) + i * 13;
          switch (item.refSlug) {
            case 'driftwood': decor.push(<Driftwood key={`${item.refSlug}-${i}`} position={pos} seed={seed} />); break;
            case 'rock': decor.push(<Rock key={`${item.refSlug}-${i}`} position={[pos[0], pos[1] + 0.2, pos[2]]} seed={seed} size={0.5 + r() * 0.3} />); break;
            case 'cave': decor.push(<Cave key={`${item.refSlug}-${i}`} position={pos} seed={seed} />); break;
            case 'live-rock': decor.push(<LiveRockPile key={`${item.refSlug}-${i}`} position={pos} seed={seed} />); break;
            case 'ornament': decor.push(<Ornament key={`${item.refSlug}-${i}`} position={pos} />); break;
            default: break;
          }
        }
      }
    }
    return { fishes, plants, decor };
  }, [items, speciesBySlug, w, d, waterH, dimensions.lengthCm]);

  const hasBackground = items.some((i) => i.kind === 'DECOR' && i.refSlug === 'background');
  const camDist = Math.max(w, d, h) * 1.6 + 2;

  return (
    <Canvas shadows camera={{ position: [camDist * 0.7, h * 0.8 + 1, camDist * 0.75], fov: 40 }} dpr={[1, 1.75]}>
      <color attach="background" args={['#0b1620']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, h + 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, h + 1, 0]} intensity={equipment.light ? 1.2 : 0.4} color="#dff6ff" />

      <group position={[0, 0, 0]}>
        {/* Meuble */}
        <mesh position={[0, -0.3, 0]} receiveShadow>
          <boxGeometry args={[w + 0.6, 0.6, d + 0.6]} />
          <meshStandardMaterial color="#1f2a33" roughness={0.8} />
        </mesh>
        {/* Substrat */}
        <mesh position={[0, substrateH / 2, 0]} receiveShadow>
          <boxGeometry args={[w - 0.08, substrateH, d - 0.08]} />
          <meshStandardMaterial color={substrateColor} roughness={1} />
        </mesh>
        {/* Eau */}
        <mesh position={[0, substrateH + (waterH - substrateH) / 2, 0]}>
          <boxGeometry args={[w - 0.08, waterH - substrateH, d - 0.08]} />
          <meshPhysicalMaterial color={WATER_COLORS[waterType]} transparent opacity={0.28} roughness={0.1} transmission={0.2} depthWrite={false} />
        </mesh>
        {/* Verre */}
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshPhysicalMaterial color="#cfe9f5" transparent opacity={0.12} roughness={0} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
          <Edges color="#8fb3c9" threshold={15} />
        </mesh>
        {hasBackground && (
          <mesh position={[0, h / 2, -d / 2 + 0.02]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color="#0e3b4f" roughness={1} />
          </mesh>
        )}

        {/* Matériel */}
        {equipment.filter && (
          <mesh position={[w / 2 - 0.5, substrateH + (waterH - substrateH) * 0.6, -d / 2 + 0.4]} castShadow>
            <boxGeometry args={[0.5, (waterH - substrateH) * 0.7, 0.4]} />
            <meshStandardMaterial color="#2b2b2b" roughness={0.5} />
          </mesh>
        )}
        {equipment.heater && (
          <mesh position={[-w / 2 + 0.4, substrateH + (waterH - substrateH) * 0.5, -d / 2 + 0.3]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, (waterH - substrateH) * 0.8, 10]} />
            <meshStandardMaterial color="#444" roughness={0.4} metalness={0.3} />
          </mesh>
        )}
        {equipment.co2 && (
          <mesh position={[-w / 2 + 0.9, substrateH + 0.3, d / 2 - 0.5]}>
            <cylinderGeometry args={[0.12, 0.12, 0.6, 10]} />
            <meshStandardMaterial color="#c8e1ea" transparent opacity={0.7} />
          </mesh>
        )}
        {equipment.light && (
          <mesh position={[0, h + 0.12, 0]}>
            <boxGeometry args={[w * 0.9, 0.12, 0.5]} />
            <meshStandardMaterial color="#e9ecef" emissive="#bde0fe" emissiveIntensity={0.8} />
          </mesh>
        )}

        {content.decor}
        {content.plants}
        {content.fishes}
      </group>

      <ContactShadows position={[0, -0.6, 0]} opacity={0.5} scale={Math.max(w, d) * 2.5} blur={2} far={4} />
      <OrbitControls target={[0, h / 2, 0]} minDistance={2} maxDistance={camDist * 2.5} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.2} />
    </Canvas>
  );
}
