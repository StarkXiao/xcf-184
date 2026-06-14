import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface KitePreviewProps {
  sailColor: string;
  frameColor: string;
  tailColor: string;
  tailLength: number;
  stringColor: string;
}

export const KitePreview: React.FC<KitePreviewProps> = ({
  sailColor,
  frameColor,
  tailColor,
  tailLength,
  stringColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const kiteGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationYRef = useRef(0);
  const rotationXRef = useRef(0.3);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4ecdc4, 0.5, 30);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    const kiteGroup = new THREE.Group();
    kiteGroupRef.current = kiteGroup;
    scene.add(kiteGroup);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (kiteGroupRef.current) {
        kiteGroupRef.current.rotation.y = rotationYRef.current;
        kiteGroupRef.current.rotation.x = rotationXRef.current;

        const time = Date.now() * 0.001;
        kiteGroupRef.current.position.y = Math.sin(time * 0.8) * 0.3;
        kiteGroupRef.current.rotation.z = Math.sin(time * 1.2) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!kiteGroupRef.current || !sceneRef.current) return;

    const kiteGroup = kiteGroupRef.current;

    while (kiteGroup.children.length > 0) {
      const child = kiteGroup.children[0];
      kiteGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 3);
    sailShape.quadraticCurveTo(3, 1.5, 2.2, 0);
    sailShape.quadraticCurveTo(0, -0.8, -2.2, 0);
    sailShape.quadraticCurveTo(-3, 1.5, 0, 3);

    const sailGeometry = new THREE.ShapeGeometry(sailShape);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: sailColor,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.1,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.castShadow = true;
    sail.rotation.x = -0.3;
    kiteGroup.add(sail);

    const frameGeometry = new THREE.CylinderGeometry(0.03, 0.03, 5.2, 8);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.7,
    });

    const vFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    vFrame.rotation.z = Math.PI / 2;
    kiteGroup.add(vFrame);

    const hFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    hFrame.scale.y = 0.6;
    hFrame.rotation.x = Math.PI / 2;
    kiteGroup.add(hFrame);

    const tailGroup = new THREE.Group();
    const segmentCount = Math.min(20, Math.floor(tailLength / 1.5));
    const actualTailLength = tailLength * 0.5;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount;
      const ribbonGeometry = new THREE.PlaneGeometry(0.25, 0.6);
      const hue = (i / segmentCount) * 0.2;
      const ribbonColor = new THREE.Color(tailColor);
      ribbonColor.offsetHSL(hue, 0, 0);
      const ribbonMaterial = new THREE.MeshStandardMaterial({
        color: ribbonColor,
        side: THREE.DoubleSide,
      });
      const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
      ribbon.position.set(0, -t * actualTailLength - 0.5, 0);
      ribbon.name = `tail-${i}`;
      tailGroup.add(ribbon);
    }
    tailGroup.position.set(0, -2, 0);
    kiteGroup.add(tailGroup);

    const stringPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const x = 0;
      const y = -t * 6;
      const z = t * 3;
      stringPoints.push(new THREE.Vector3(x, y, z));
    }
    const stringGeometry = new THREE.BufferGeometry().setFromPoints(stringPoints);
    const stringMaterial = new THREE.LineBasicMaterial({
      color: stringColor,
      linewidth: 1,
    });
    const stringMesh = new THREE.Line(stringGeometry, stringMaterial);
    stringMesh.position.set(0, -0.5, 0);
    kiteGroup.add(stringMesh);

    const updateTailAnimation = () => {
      if (!kiteGroupRef.current) return;
      const time = Date.now() * 0.003;

      for (let i = 0; i < tailGroup.children.length; i++) {
        const ribbon = tailGroup.children[i] as THREE.Mesh;
        const wave = Math.sin(time + i * 0.4) * 0.2;
        ribbon.rotation.z = wave;
        ribbon.position.x = wave * (i * 0.15);
      }

      requestAnimationFrame(updateTailAnimation);
    };
    updateTailAnimation();
  }, [sailColor, frameColor, tailColor, tailLength, stringColor]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMouseRef.current.x;
    const deltaY = e.clientY - previousMouseRef.current.y;

    rotationYRef.current += deltaX * 0.01;
    rotationXRef.current += deltaY * 0.01;
    rotationXRef.current = Math.max(-0.8, Math.min(0.8, rotationXRef.current));

    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="kite-preview-container">
      <h3 className="panel-title">风筝预览</h3>
      <div
        ref={containerRef}
        className="kite-preview-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      <div className="preview-hint">
        <span>🖱️ 拖动旋转查看</span>
      </div>
    </div>
  );
};
