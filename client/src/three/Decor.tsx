import { useMemo } from 'react';
import { seeded } from './random';

export function Driftwood({ position, seed }: { position: [number, number, number]; seed: number }) {
  const r = seeded(seed);
  const rot = r() * Math.PI;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh rotation={[0, 0, 1.1]} position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, 2.2, 7]} />
        <meshStandardMaterial color="#5b3a1e" roughness={0.95} />
      </mesh>
      <mesh rotation={[0.4, 0, -0.9]} position={[0.3, 0.7, 0.2]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 1.6, 7]} />
        <meshStandardMaterial color="#6b4423" roughness={0.95} />
      </mesh>
      <mesh rotation={[-0.6, 0, 0.3]} position={[-0.4, 0.4, -0.2]} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 1.2, 7]} />
        <meshStandardMaterial color="#4e2f14" roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Rock({ position, seed, size = 0.5, color = '#6c757d' }: { position: [number, number, number]; seed: number; size?: number; color?: string }) {
  const r = seeded(seed);
  const s: [number, number, number] = [size * (0.8 + r() * 0.6), size * (0.5 + r() * 0.5), size * (0.8 + r() * 0.6)];
  return (
    <mesh position={position} rotation={[r(), r() * 3, r()]} scale={s} castShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  );
}

export function Cave({ position, seed }: { position: [number, number, number]; seed: number }) {
  const r = seeded(seed);
  return (
    <mesh position={[position[0], position[1] + 0.3, position[2]]} rotation={[Math.PI / 2, 0, r() * Math.PI]} castShadow>
      <torusGeometry args={[0.35, 0.18, 8, 12, Math.PI]} />
      <meshStandardMaterial color="#8d6e63" roughness={0.9} />
    </mesh>
  );
}

export function Ornament({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={[position[0], position[1] + 0.4, position[2]]} castShadow>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#b56576" roughness={0.6} />
    </mesh>
  );
}

export function LiveRockPile({ position, seed }: { position: [number, number, number]; seed: number }) {
  const rocks = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: 5 }, (_, i) => ({ x: (r() - 0.5) * 1.2, y: i * 0.25, z: (r() - 0.5) * 1.2, s: 0.35 + r() * 0.3, seed: seed + i }));
  }, [seed]);
  return (
    <group position={position}>
      {rocks.map((rk, i) => <Rock key={i} position={[rk.x, rk.y, rk.z]} seed={rk.seed} size={rk.s} color="#9c89b8" />)}
    </group>
  );
}
