
import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GestureState, HandData, LetterContent } from '../types';
import { COLORS, PARTICLE_CONFIG } from '../constants';

interface Scene3DProps {
  gesture: GestureState;
  handData: HandData | null;
  letterContent: LetterContent;
}

const Scene3D: React.FC<Scene3DProps> = ({ gesture, handData, letterContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const snowflakeRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<THREE.InstancedMesh | null>(null);
  const starRef = useRef<THREE.Mesh | null>(null);
  const starLightRef = useRef<THREE.PointLight | null>(null);
  
  const decorsRef = useRef<{
    gifts: THREE.InstancedMesh;
    candies: THREE.InstancedMesh;
    hearts: THREE.InstancedMesh;
    photos: THREE.InstancedMesh[];
    balls: THREE.InstancedMesh;
  } | null>(null);

  const frameIdRef = useRef<number>(0);
  const count = window.innerWidth > 768 ? PARTICLE_CONFIG.PC_COUNT : PARTICLE_CONFIG.MOBILE_COUNT;
  const lightStripCount = 350;

  // 粒子位置系统
  const currentPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const targetPositions = useMemo(() => new Float32Array(count * 3), [count]);
  
  // 树形初始位置（握拳回归用）
  const originalTreePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const h = Math.random() * 12; 
        const radius = (12 - h) * 0.35;
        arr[i * 3] = Math.cos(angle) * radius;
        arr[i * 3 + 1] = h - 6;
        arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, [count]);

  const lightCurrentPos = useMemo(() => new Float32Array(lightStripCount * 3), [lightStripCount]);
  const lightTargetPos = useMemo(() => new Float32Array(lightStripCount * 3), [lightStripCount]);
  const originalLightPositions = useMemo(() => {
    const arr = new Float32Array(lightStripCount * 3);
    for (let i = 0; i < lightStripCount; i++) {
        const progress = i / lightStripCount;
        const h = progress * 12;
        const radius = (12 - h) * 0.38;
        const angle = progress * Math.PI * 20; // 螺旋密度
        arr[i * 3] = Math.cos(angle) * radius;
        arr[i * 3 + 1] = h - 6;
        arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, [lightStripCount]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 18); 
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const createTexture = (type: 'circle' | 'photo' | 'heart') => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      if (type === 'circle') {
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
      } else if (type === 'heart') {
        ctx.fillStyle = COLORS.CRIMSON;
        ctx.beginPath(); ctx.moveTo(64, 40);
        ctx.bezierCurveTo(64, 37, 58, 26, 44, 26); ctx.bezierCurveTo(26, 26, 26, 49, 26, 49);
        ctx.bezierCurveTo(26, 64, 44, 82, 64, 96); ctx.bezierCurveTo(84, 82, 102, 64, 102, 49);
        ctx.bezierCurveTo(102, 49, 102, 26, 84, 26); ctx.bezierCurveTo(74, 26, 64, 37, 64, 40);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const circleTex = createTexture('circle');

    // 粒子系统初始化
    const geo = new THREE.BufferGeometry();
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      currentPositions[i * 3] = originalTreePositions[i * 3];
      currentPositions[i * 3 + 1] = originalTreePositions[i * 3 + 1];
      currentPositions[i * 3 + 2] = originalTreePositions[i * 3 + 2];
      targetPositions[i * 3] = originalTreePositions[i * 3];
      targetPositions[i * 3 + 1] = originalTreePositions[i * 3 + 1];
      targetPositions[i * 3 + 2] = originalTreePositions[i * 3 + 2];
      const r = 0.1 + Math.random() * 0.2, g = 0.5 + Math.random() * 0.5, b = 0.1 + Math.random() * 0.2;
      colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, map: circleTex, depthWrite: false });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
    particlesRef.current = particles;

    // 灯带初始化
    const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: COLORS.GOLD, transparent: true });
    const instancedLights = new THREE.InstancedMesh(lightGeo, lightMat, lightStripCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < lightStripCount; i++) {
      lightCurrentPos[i * 3] = originalLightPositions[i * 3];
      lightCurrentPos[i * 3 + 1] = originalLightPositions[i * 3 + 1];
      lightCurrentPos[i * 3 + 2] = originalLightPositions[i * 3 + 2];
      lightTargetPos[i * 3] = originalLightPositions[i * 3];
      lightTargetPos[i * 3 + 1] = originalLightPositions[i * 3 + 1];
      lightTargetPos[i * 3 + 2] = originalLightPositions[i * 3 + 2];
      dummy.position.set(originalLightPositions[i * 3], originalLightPositions[i * 3 + 1], originalLightPositions[i * 3 + 2]);
      dummy.updateMatrix();
      instancedLights.setMatrixAt(i, dummy.matrix);
      instancedLights.setColorAt(i, new THREE.Color(COLORS.GOLD));
    }
    scene.add(instancedLights);
    lightsRef.current = instancedLights;

    // 装饰物逻辑
    const giftMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshPhongMaterial({ color: COLORS.CRIMSON }), 40);
    const candyMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4), new THREE.MeshPhongMaterial({ color: COLORS.SNOW }), 40);
    const ballMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 1, roughness: 0.1, emissive: COLORS.GOLD, emissiveIntensity: 3 }), 50);

    const setupInstances = (mesh: THREE.InstancedMesh, icount: number) => {
      for (let i = 0; i < icount; i++) {
        const idx = Math.floor(Math.random() * count);
        dummy.position.set(originalTreePositions[idx * 3], originalTreePositions[idx * 3 + 1], originalTreePositions[idx * 3 + 2]);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      scene.add(mesh);
    };
    setupInstances(giftMesh, 40); setupInstances(candyMesh, 40); setupInstances(ballMesh, 50);

    const photoCount = letterContent.photoCount || 40;
    const photoMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.45, 0.6), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, side: THREE.DoubleSide }), photoCount);
    for (let i = 0; i < photoCount; i++) {
      const idx = Math.floor(Math.random() * count);
      dummy.position.set(originalTreePositions[idx * 3], originalTreePositions[idx * 3 + 1], originalTreePositions[idx * 3 + 2]);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      photoMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(photoMesh);
    decorsRef.current = { gifts: giftMesh, candies: candyMesh, hearts: null as any, photos: [photoMesh], balls: ballMesh };

    // 顶端星星
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? 0.8 : 0.35;
      const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
      starShape[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    starShape.closePath();
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.2, bevelEnabled: true }), new THREE.MeshStandardMaterial({ color: COLORS.GOLD, emissive: COLORS.GOLD, emissiveIntensity: 5.0 }));
    star.position.set(0, 6.5, 0); scene.add(star); starRef.current = star;
    const starLight = new THREE.PointLight(COLORS.GOLD, 4, 10); starLight.position.set(0, 6.5, 0); scene.add(starLight); starLightRef.current = starLight;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pointLight = new THREE.PointLight(0xffffff, 1.5); pointLight.position.set(5, 5, 5); scene.add(pointLight);

    // 雪花
    const snowCount = PARTICLE_CONFIG.SNOW_COUNT;
    const snowPos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 60; snowPos[i * 3 + 1] = (Math.random() - 0.5) * 60; snowPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const snowflakes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(snowPos, 3)), new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.8, map: circleTex, depthWrite: false }));
    scene.add(snowflakes); snowflakeRef.current = snowflakes;

    let time = 0;
    let scatterRotationY = 0;
    
    const animate = () => {
      time += 0.01;
      frameIdRef.current = requestAnimationFrame(animate);
      
      const isScatter = gesture === GestureState.SCATTER;
      if (isScatter) {
        scatterRotationY += 0.005; // 散开时的缓慢旋转
        if (particlesRef.current) particlesRef.current.rotation.y = scatterRotationY;
        if (lightsRef.current) lightsRef.current.rotation.y = scatterRotationY;
      } else {
        scatterRotationY = 0;
        const rotY = 0.006;
        [particlesRef.current, lightsRef.current, giftMesh, candyMesh, ballMesh, photoMesh].forEach(obj => {
          if (obj) obj.rotation.y += rotY;
        });
      }

      if (starRef.current) starRef.current.scale.setScalar(1.2 + Math.sin(time * 3) * 0.15);
      if (starLightRef.current) starLightRef.current.intensity = 5 + Math.sin(time * 3) * 2;

      // 粒子平滑插值
      const positions = particlesRef.current?.geometry.attributes.position.array as Float32Array;
      if (positions) {
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          positions[idx] += (targetPositions[idx] - positions[idx]) * 0.06;
          positions[idx + 1] += (targetPositions[idx + 1] - positions[idx + 1]) * 0.06;
          positions[idx + 2] += (targetPositions[idx + 2] - positions[idx + 2]) * 0.06;
        }
        particlesRef.current!.geometry.attributes.position.needsUpdate = true;
      }

      // 灯带动态颜色与移动
      if (lightsRef.current) {
        const color = new THREE.Color();
        for (let i = 0; i < lightStripCount; i++) {
          const idx = i * 3;
          lightCurrentPos[idx] += (lightTargetPos[idx] - lightCurrentPos[idx]) * 0.08;
          lightCurrentPos[idx + 1] += (lightTargetPos[idx + 1] - lightCurrentPos[idx + 1]) * 0.08;
          lightCurrentPos[idx + 2] += (lightTargetPos[idx + 2] - lightCurrentPos[idx + 2]) * 0.08;
          
          dummy.position.set(lightCurrentPos[idx], lightCurrentPos[idx + 1], lightCurrentPos[idx + 2]);
          dummy.updateMatrix();
          lightsRef.current.setMatrixAt(i, dummy.matrix);

          const brightness = (Math.sin(time * 4 + (i / lightStripCount) * 12) + 1) / 2;
          color.set(COLORS.GOLD).lerp(new THREE.Color(COLORS.SNOW), brightness * 0.7);
          lightsRef.current.setColorAt(i, color);
        }
        lightsRef.current.instanceMatrix.needsUpdate = true;
        if (lightsRef.current.instanceColor) lightsRef.current.instanceColor.needsUpdate = true;
      }

      // 雪花物理效果
      const snowPositions = snowflakeRef.current?.geometry.attributes.position.array as Float32Array;
      if (snowPositions) {
        for (let i = 0; i < snowCount; i++) {
          const idx = i * 3;
          snowPositions[idx + 1] -= (0.02 + Math.sin(time * 0.3 + i) * 0.01);
          snowPositions[idx] += Math.sin(time * 0.8 + i) * 0.01;
          if (snowPositions[idx + 1] < -30) snowPositions[idx + 1] = 30;
        }
        snowflakeRef.current!.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      renderer.dispose();
    };
  }, [count, letterContent]);

  useEffect(() => {
    if (!particlesRef.current || !lightsRef.current) return;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      if (gesture === GestureState.SCATTER) {
        const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI, r = 16 + Math.random() * 8;
        targetPositions[idx] = r * Math.sin(phi) * Math.cos(theta);
        targetPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        targetPositions[idx + 2] = r * Math.cos(phi);
      } else if (gesture === GestureState.TREE || gesture === GestureState.HEART) {
        targetPositions[idx] = originalTreePositions[idx];
        targetPositions[idx + 1] = originalTreePositions[idx + 1];
        targetPositions[idx + 2] = originalTreePositions[idx + 2];
      } else if (gesture === GestureState.FOCUS) {
        const fx = handData?.landmarks[8]?.x ? (handData.landmarks[8].x - 0.5) * 25 : 0;
        const fy = handData?.landmarks[8]?.y ? -(handData.landmarks[8].y - 0.5) * 20 : 0;
        // 聚焦时粒子环绕手指点
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 6;
        targetPositions[idx] = fx + Math.cos(angle) * rad;
        targetPositions[idx + 1] = fy + Math.sin(angle) * rad;
        targetPositions[idx + 2] = (Math.random() - 0.5) * 4;
      }
    }

    for (let i = 0; i < lightStripCount; i++) {
      const idx = i * 3;
      if (gesture === GestureState.SCATTER) {
        const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI, r = 13 + Math.random() * 6;
        lightTargetPos[idx] = r * Math.sin(phi) * Math.cos(theta);
        lightTargetPos[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        lightTargetPos[idx + 2] = r * Math.cos(phi);
      } else {
        lightTargetPos[idx] = originalLightPositions[idx];
        lightTargetPos[idx + 1] = originalLightPositions[idx + 1];
        lightTargetPos[idx + 2] = originalLightPositions[idx + 2];
      }
    }

    const isTreeVisible = gesture !== GestureState.SCATTER;
    if (decorsRef.current) {
        ['gifts', 'candies', 'balls'].forEach(key => (decorsRef.current as any)[key].visible = isTreeVisible);
        decorsRef.current.photos.forEach(m => m.visible = isTreeVisible);
    }
    if (starRef.current) starRef.current.visible = isTreeVisible;
    if (starLightRef.current) starLightRef.current.visible = isTreeVisible;

  }, [gesture, count, handData, originalTreePositions, originalLightPositions]);

  return <div ref={containerRef} className="absolute inset-0 z-0 flex items-center justify-center" />;
};

export default Scene3D;
