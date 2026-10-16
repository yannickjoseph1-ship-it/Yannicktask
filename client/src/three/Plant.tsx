import { useMemo } from 'react';
import { seeded } from './random';

export interface PlantProps {
  seed: number;
  position: [number, number, number];
  heightCm: number;
  maxHeight: number;
  color: string;
  rooted: boolean;
}

/** Plante générique : touffe de feuilles (cônes aplatis) ou coussin de mousse. */
export function Plant({ seed, position, heightCm, maxHeight, color, rooted }: PlantProps) {
  const leaves = useMemo(() => {
    const r = seeded(seed);
    const h = Math.min(maxHeight * 0.9, Math.max(0.3, heightCm / 10));
    const n = rooted ? 5 + Math.floor(r() * 4) : 3;
    return Array.from({ length: n }, () => ({
      h: h * (0.6 + r() * 0.4),
      tilt: (r() - 0.5) * 0.8,
      rot: r() * Math.PI * 2,
      off: (r() - 0.5) * 0.3,
    }));
  }, [seed, heightCm, maxHeight, rooted]);

  if (!rooted) {
    // Mousse / plante épiphyte : amas de sphères basses
    return (
      <group position={position}>
        {leaves.map((l, i) => (
          <mesh key={i} position={[l.off, l.h * 0.25, l.off * (i % 2 ? -1 : 1)]} castShadow>
            <sphereGeometry args={[0.25 + l.h * 0.15, 10, 8]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={position}>
      {leaves.map((l, i) => (
        <mesh key={i} position={[l.off, l.h / 2, 0]} rotation={[l.tilt, l.rot, l.tilt / 2]} scale={[1, 1, 0.3]} castShadow>
          <coneGeometry args={[0.18, l.h, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
