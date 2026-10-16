import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { seeded } from './random';

export interface FishProps {
  seed: number;
  /** Boîte d'eau (unités scène), centrée en x/z, y de 0 à height */
  bounds: { w: number; h: number; d: number };
  sizeCm: number;
  color: string;
  bottomDweller?: boolean;
  invertebrate?: boolean;
}

/** Poisson générique : corps ellipsoïde + nageoire caudale, nage en Lissajous. */
export function Fish({ seed, bounds, sizeCm, color, bottomDweller, invertebrate }: FishProps) {
  const group = useRef<THREE.Group>(null);
  const p = useMemo(() => {
    const r = seeded(seed);
    const margin = 0.6;
    return {
      ax: (bounds.w / 2 - margin) * (0.5 + r() * 0.5),
      az: (bounds.d / 2 - margin) * (0.5 + r() * 0.5),
      ay: bottomDweller ? 0.1 : (bounds.h * 0.3) * r(),
      cy: bottomDweller ? 0.35 : bounds.h * (0.35 + r() * 0.4),
      fx: 0.15 + r() * 0.25,
      fz: 0.1 + r() * 0.3,
      fy: 0.2 + r() * 0.3,
      px: r() * Math.PI * 2,
      pz: r() * Math.PI * 2,
      py: r() * Math.PI * 2,
      wag: 6 + r() * 4,
    };
  }, [seed, bounds, bottomDweller]);

  const scale = Math.max(0.15, Math.min(1.6, sizeCm / 10)); // 10 cm → 1 unité
  const tail = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = group.current;
    if (!g) return;
    const x = p.ax * Math.sin(t * p.fx + p.px);
    const z = p.az * Math.sin(t * p.fz + p.pz);
    const y = p.cy + p.ay * Math.sin(t * p.fy + p.py);
    const dx = p.ax * p.fx * Math.cos(t * p.fx + p.px);
    const dz = p.az * p.fz * Math.cos(t * p.fz + p.pz);
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(-dz, dx);
    if (tail.current) tail.current.rotation.y = Math.sin(t * p.wag) * 0.4;
  });

  if (invertebrate) {
    return (
      <group ref={group} scale={scale}>
        <mesh castShadow>
          <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.05, 0.4, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group} scale={scale}>
      <mesh castShadow scale={[1, 0.55, 0.3]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh ref={tail} position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.22, 0.4, 3]} />
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.12, 0.25, 3]} />
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.32, 0.08, 0.13]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.32, 0.08, -0.13]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}
