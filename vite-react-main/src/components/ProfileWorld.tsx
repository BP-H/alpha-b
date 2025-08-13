import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Instances, Instance, OrbitControls } from "@react-three/drei";
import { useNavigate, useParams } from "react-router-dom";
import bus from "../lib/bus";
import { WorldState, defaultWorld, clampWorld } from "../lib/world";
import { ringPositions, FloorGrid } from "./World3D";
import PostCard from "./PostCard";
import { Post, User } from "../types";

// Props include list of all posts and current user info
export default function ProfileWorld({ posts, me }: { posts: Post[]; me: User }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const userPosts = useMemo(() => posts.filter((p) => p.author === id), [posts, id]);

  const [w, setW] = useState<WorldState>(defaultWorld);
  useEffect(() => bus.on("world:update", (p: Partial<WorldState>) => setW((s) => clampWorld({ ...s, ...p }))), []);

  const bg = w.theme === "dark" ? "#0b0d12" : "#f6f8fb";
  const fogC = w.theme === "dark" ? "#0b0d12" : "#f1f4fa";
  const gridC = w.theme === "dark" ? "#283044" : "#e5eaf4";
  const fogNear = 12 + w.fogLevel * 6;
  const fogFar = 44 - w.fogLevel * 16;
  const positions = useMemo(() => ringPositions(userPosts.length || 1), [userPosts.length]);

  return (
    <div className="world-wrap" style={{ position: "relative" }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0.2, 7], fov: 50 }} style={{ height: "100vh" }}>
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[fogC, fogNear, fogFar]} />
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 8, 3]} intensity={0.65} />
        <FloorGrid color={gridC} opacity={w.gridOpacity} />
        <Instances limit={64}>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial
            color={w.orbColor}
            emissive={w.theme === "dark" ? "#6b72ff" : "#b6bcff"}
            emissiveIntensity={0.16}
            roughness={0.25}
            metalness={0.55}
          />
          {positions.map((p, i) => (
            <Float key={i} floatIntensity={0.6} rotationIntensity={0.25} speed={0.9 + (i % 4) * 0.15}>
              <Instance position={p} />
            </Float>
          ))}
        </Instances>
        <OrbitControls enablePan={false} />
      </Canvas>

      <div className="world-bottombar">
        <button className="pill" onClick={() => navigate("/")}>Back to Feed</button>
        {id && <span className="crumb">Profile • {id}</span>}
      </div>

      <div className="content-viewport feed-wrap" style={{ position: "absolute", top: 0, left: 0 }}>
        <div className="feed-content">
          {userPosts.map((p) => (
            <PostCard key={p.id} post={p} me={me} />
          ))}
        </div>
      </div>
    </div>
  );
}
