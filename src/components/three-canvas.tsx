'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useScroll } from '@/lib/scroll-observer';

const ThreeCanvas: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { scrollProgress } = useScroll();
    
    // Using refs to hold Three.js objects to prevent re-creation on re-renders
    const sceneRef = useRef<THREE.Scene>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const fruitsRef = useRef<THREE.Group>();
    const clock = useRef(new THREE.Clock());

    const colors = useMemo(() => ({
        darkBackground: new THREE.Color(0x0a0a0a),
    }), []);
    
    useEffect(() => {
        if (!mountRef.current) return;
        
        const currentMount = mountRef.current;

        // Initialize scene, camera, and renderer only once
        if (!rendererRef.current) {
            const scene = new THREE.Scene();
            scene.background = colors.darkBackground;
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            currentMount.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Softer ambient light
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // Softer directional light
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);

            // Create and add fruit group
            const group = new THREE.Group();
            
            const fruitTypes = [
                {
                    geometry: new THREE.SphereGeometry(0.5, 32, 32), // Watermelon
                    colors: [0x228B22] // ForestGreen
                },
                { 
                    geometry: new THREE.SphereGeometry(0.3, 32, 32), // Apple
                    colors: [0xff0000] 
                },
                { 
                    geometry: new THREE.SphereGeometry(0.25, 32, 32), // Tomato
                    colors: [0xff6347] 
                },
            ];

            for (let i = 0; i < 100; i++) {
                const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                const color = type.colors[Math.floor(Math.random() * type.colors.length)];

                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.05, // Less metallic
                    roughness: 0.8,  // More rough, less shiny
                });

                const fruit = new THREE.Mesh(type.geometry, material);
                fruit.position.set(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15
                );
                fruit.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                group.add(fruit);
            }
            scene.add(group);
            fruitsRef.current = group;
        }
        
        // Handle window resize
        const handleResize = () => {
            if (cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Start animation loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !fruitsRef.current) return;

            const elapsedTime = clock.current.getElapsedTime();
            const slowDownFactor = Math.max(0.1, 1 - scrollProgress * 0.9);
            
            fruitsRef.current.rotation.x = scrollProgress * Math.PI - elapsedTime * 0.1 * slowDownFactor;
            fruitsRef.current.rotation.y = scrollProgress * Math.PI * 0.5 - elapsedTime * 0.05 * slowDownFactor;

            cameraRef.current.position.z = 5 - scrollProgress * 2;
            cameraRef.current.position.x = Math.sin(elapsedTime * 0.2 * slowDownFactor) * 0.5;
            cameraRef.current.position.y = Math.cos(elapsedTime * 0.2 * slowDownFactor) * 0.5;

            rendererRef.current.render(sceneRef.current, cameraRef.current);
        };
        
        if (rendererRef.current) {
          animate();
        }

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, [colors, scrollProgress]); 

    return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default ThreeCanvas;
