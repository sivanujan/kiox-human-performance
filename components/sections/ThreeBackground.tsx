"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (mountRef.current.children.length > 0) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#080808', 0.04);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.rotation.x = -0.2; 

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "default" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ff88, 100, 100); 
    pointLight.position.set(0, 10, 5);
    scene.add(pointLight);

    // 3. Grid
    const gridHelper = new THREE.GridHelper(200, 100, '#00ff88', '#00ff88');
    const bgMaterial = gridHelper.material as THREE.Material;
    bgMaterial.opacity = 0.3;
    bgMaterial.transparent = true;
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // 4. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      try {
        gridHelper.position.z += 0.2; 
        if (gridHelper.position.z >= 2) gridHelper.position.z -= 2; 
        gridHelper.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;

        renderer.render(scene, camera);
      } catch (e) {
        console.error("ThreeJS Animation loop error:", e);
      }
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      
      scene.clear();
      renderer.dispose();
      
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
