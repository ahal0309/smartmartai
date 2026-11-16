'use client';

import dynamic from 'next/dynamic';

const ThreeCanvas = dynamic(() => import('@/components/three-canvas'), {
  ssr: false,
});

export default function Scene() {
  return <ThreeCanvas />;
}
