// src/components/World3D.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float, Instances, Instance, OrbitControls } from "@react-three/drei";
import { XR, createXRStore, useXRStore, useXRControllerLocomotion } from "@react-three/xr";
import * as THREE from "three";
import type { Post } from "../types";
import bus from "../lib/bus";
import { WorldState, defaultWorld, clampWorld } from "../lib/world";

/** Exported — used by ProfileWorld */
export function ringPositions(count: number) {
  const arr: [number, number, number][] = [];
  const r = 7.2;
  const n = Math.max(1, count); // avoid divide-by-zero → always at least 1
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    arr.push([Math.cos(a) * r, Math.sin(a) * 0.6, -10 - (i % 3) * 0.35]);
  }
  return arr;
}

/** Exported — used by ProfileWorld */
export function FloorGrid({ color, opacity }: { color: string; opacity: number }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(240, 240, 120, 120), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, -8]} geometry={geo}>
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

/** Bridges outer React state changes to R3F's demand frameloop */
function DemandBridge({ deps }: { deps: any[] }) {
  const { invalidate } = useThree();

  // Draw once whenever any of the deps change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void invalidate(), deps);

  // Redraw on tab visibility return
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [invalidate]);

  // Redraw when world updates come purely via the event bus
  useEffect(() => {
    const off = bus.on?.("world:update", () => invalidate());
    return () => {
      try { off?.(); } catch {}
    };
  }, [invalidate]);

  return null;
}

/** Simple continuous locomotion when in XR (stick/motion controller) */
function VRLocomotion() {
  const store = useXRStore();
  useXRControllerLocomotion((velocity, rotationVelocityY, delta) => {
    const origin = store.getState().origin;
    if (!origin) return;
    origin.position.addScaledVector(velocity, delta);
    origin.rotation.y += rotationVelocityY * delta;
  });
  return null;
}

/** Hide OrbitControls while XR session is active */
function OrbitWhenNotXR() {
  const session = useXRStore((s) => s.session);
  return session ? null : <OrbitControls enablePan={false} />;
}

export default function World3D({
  selected,
  onBack,
}: {
  selected: Post | null;
  onBack: () => void;
}) {
  const [w, setW] = useState<WorldState>(defaultWorld);

  // Subscribe to world updates and cleanup on unmount/hot-reload
  useEffect(() => {
    const off = bus.on?.("world:update", (p: Partial<WorldState>) =>
      setW((s) => clampWorld({ ...s, ...p }))
    );
    return () => {
      try { off?.(); } catch {}
    };
  }, []);

  // Shared XR store
  const xrStore = useMemo(() => createXRStore(), []);
  const startSession = (mode: XRSessionMode) => {
    // silent fail if unsupported
    xrStore.enterXR(mode).catch(() => {});
  };

  // Theme / fog palette
  const bg = w.theme === "dark" ? "#0b0d12" : "#f6f8fb";
  const fogC = w.theme === "dark" ? "#0b0d12" : "#f1f4fa";
  const gridC = w.theme === "dark" ? "#283044" : "#e5eaf4";
  const fogNear = 12 + w.fogLevel * 6;
  const fogFar = 44 - w.fogLevel * 16;

  const positions = useMemo(() => ringPositions(w.orbCount), [w.orbCount]);

  return (
    <div className="world-wrap" style={{ position: "relative" }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.2, 7], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ height: "100vh" }}
        frameloop="demand" // ⚡ GPU-friendly
      >
        <XR store={xrStore}>
          {/* Trigger a single frame whenever these change */}
          <DemandBridge deps={[w.theme, w.fogLevel, w.gridOpacity, w.orbColor, positions.length]} />

          <VRLocomotion />
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[fogC, fogNear, fogFar]} />

          <ambientLight intensity={1.0} />
          <directionalLight position={[5, 8, 3]} intensity={0.65} />

          <FloorGrid color={gridC} opacity={w.gridOpacity} />

          <Instances limit={128}>
            <sphereGeometry args={[0.26, 32, 32]} />
            <meshStandardMaterial
              color={w.orbColor}
              emissive={w.theme === "dark" ? "#6b72ff" : "#b6bcff"}
              emissiveIntensity={0.16}
              roughness={0.25}
              metalness={0.55}
            />
            {positions.map((p, i) => (
              <Float
                key={i}
                floatIntensity={0.6}
                rotationIntensity={0.25}
                speed={0.9 + (i % 4) * 0.15}
              >
                <Instance position={p} />
              </Float>
            ))}
          </Instances>

          <OrbitWhenNotXR />
        </XR>
      </Canvas>

      {/* Bottom-only glass bar */}
      <div className="world-bottombar">
        <button className="pill" onClick={onBack}>Back to Feed</button>
        <button className="pill" onClick={() => startSession("immersive-vr")}>Enter VR</button>
        {selected && <span className="crumb">Portal • {selected.title}</span>}
      </div>
    </div>
  );
}
