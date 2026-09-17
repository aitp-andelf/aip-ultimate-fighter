import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { CHARACTER_LIST } from "@aipuf/content";
import type { CharacterDef, CharacterId } from "@aipuf/contracts";
import { sound } from "../audio/sound.ts";

interface CharacterLabScreenProps {
  onBack: () => void;
}

export const CharacterLabScreen: React.FC<CharacterLabScreenProps> = ({ onBack }) => {
  const [selectedId, setSelectedId] = useState<CharacterId>("shoto-a");
  const [activeAnim, setActiveAnim] = useState<string>("idle");
  const [availableAnims, setAvailableAnims] = useState<string[]>([]);
  const [modelStats, setModelStats] = useState<{ height: number; meshes: number; bones: number } | null>(null);
  const [customModelName, setCustomModelName] = useState<string | null>(null);

  const char = CHARACTER_LIST.find((c) => c.id === selectedId)!;

  // 3D Viewport refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const animFrameRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Setup Three.js 3D Inspector Viewport
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.8);
    camera.lookAt(0, 1.0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    canvasRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(2.5, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    fillLight.position.set(-3, 2, 1);
    scene.add(fillLight);

    // Grid Floor
    const grid = new THREE.GridHelper(6, 12, 0x334155, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Render loop
    const animate = () => {
      const dt = clockRef.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(dt);
      }
      modelGroup.rotation.y += 0.005; // Gentle turntable rotation
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight || 340;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, []);

  // Load character 3D model when character changes
  useEffect(() => {
    loadModel(char.modelUrl || "/models/RobotExpressive.glb", char.colors[0], char.colors[1]);
  }, [selectedId]);

  const loadModel = (url: string, pCol: string, sCol: string) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        applyGltfScene(gltf, pCol, sCol);
      },
      undefined,
      () => {
        // Fallback procedural visualizer if offline
        createFallbackMesh(pCol, sCol);
      }
    );
  };

  const applyGltfScene = (
    gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] },
    pCol: string,
    sCol: string
  ) => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.clear();

    const clone = SkeletonUtils.clone(gltf.scene) as THREE.Group;

    let meshCount = 0;
    let boneCount = 0;

    const pColor = new THREE.Color(pCol);
    const sColor = new THREE.Color(sCol);

    clone.traverse((child: any) => {
      if (child.isMesh) {
        meshCount++;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          child.material = Array.isArray(child.material)
            ? mats.map((m: any) => m.clone())
            : mats[0].clone();
          const cloned = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of cloned) {
            if (mat.map) continue;
            const name = (mat.name || "").toLowerCase();
            if (name.includes("main") || name.includes("highlimbs") || !name) {
              mat.color = pColor;
            } else if (name.includes("grey") || name.includes("joints")) {
              mat.color = sColor;
            }
          }
        }
      }
      if (child.isBone) {
        boneCount++;
      }
    });

    // Auto-scale to 1.8m
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = 1.8 / (size.y || 1);
    clone.scale.set(scale, scale, scale);
    clone.position.y = -box.min.y * scale;

    setModelStats({
      height: +(size.y * scale).toFixed(2),
      meshes: meshCount,
      bones: boneCount,
    });

    modelGroupRef.current.add(clone);

    // Setup Animation Mixer
    const mixer = new THREE.AnimationMixer(clone);
    mixerRef.current = mixer;
    const actions: Record<string, THREE.AnimationAction> = {};
    const animNames: string[] = [];

    for (const clip of gltf.animations) {
      const act = mixer.clipAction(clip);
      actions[clip.name.toLowerCase()] = act;
      animNames.push(clip.name);
    }
    actionsRef.current = actions;
    setAvailableAnims(animNames);

    // Play first or idle animation
    const firstAnim = animNames.find((n) => n.toLowerCase().includes("idle")) || animNames[0];
    if (firstAnim) {
      playAction(firstAnim);
    }
  };

  const createFallbackMesh = (pCol: string, sCol: string) => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.clear();
    const mat = new THREE.MeshStandardMaterial({ color: pCol });
    const geo = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.9;
    modelGroupRef.current.add(mesh);
    setModelStats({ height: 1.8, meshes: 1, bones: 0 });
    setAvailableAnims([]);
  };

  const playAction = (name: string) => {
    sound.playUiClick();
    setActiveAnim(name);
    const act = actionsRef.current[name.toLowerCase()];
    if (!act || !mixerRef.current) return;

    Object.values(actionsRef.current).forEach((a) => a.fadeOut(0.15));
    act.reset().fadeIn(0.15).play();
  };

  // Handle custom .glb file upload by the user
  const handleCustomGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playUiClick();
    setCustomModelName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) return;

      const loader = new GLTFLoader();
      loader.parse(
        arrayBuffer,
        "",
        (gltf) => {
          applyGltfScene(gltf, char.colors[0], char.colors[1]);
        },
        (err) => {
          console.error("Kunde inte tolka GLB-fil:", err);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-8 py-3.5 backdrop-blur shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { sound.playUiClick(); onBack(); }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition active:scale-95"
          >
            ← Tillbaka
          </button>
          <h1 className="text-2xl font-black tracking-wider text-yellow-400 drop-shadow">
            CHARACTER LAB & 3D MODELLINSPEKTOR
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Custom GLB Uploader Button */}
          <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-black tracking-wide text-white shadow hover:brightness-110 active:scale-95 transition">
            <span>📁 LADDA UPP EGEN .GLB-MODELL</span>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleCustomGlbUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-12 gap-5 p-5 overflow-hidden">
        {/* Character Selector sidebar */}
        <div className="col-span-3 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 overflow-y-auto shadow-lg backdrop-blur">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">
            Välj Kämpe att Inspektera
          </h3>
          {CHARACTER_LIST.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                sound.playUiClick();
                setSelectedId(c.id);
                setCustomModelName(null);
              }}
              className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                c.id === selectedId
                  ? "border-blue-500 bg-blue-950/70 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                  : "border-slate-800/80 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center font-black text-white text-xs shadow"
                style={{ backgroundColor: c.colors[0] }}
              >
                {c.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-black text-sm text-white">{c.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase truncate">{c.tagline ?? c.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* 3D Inspector Viewport & Framedata */}
        <div className="col-span-9 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-5 overflow-y-auto space-y-5 shadow-lg backdrop-blur">
          {/* Top Section: 3D Viewport + Model Stats */}
          <div className="grid grid-cols-12 gap-4">
            {/* 3D Interactive Canvas */}
            <div className="col-span-7 relative flex flex-col h-72 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner">
              <div ref={canvasRef} className="h-full w-full" />

              {/* Overlay Badge */}
              <div className="absolute top-2.5 left-3 flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{customModelName ? `Egen fil: ${customModelName}` : (char.modelUrl ? char.modelUrl.split("/").pop() : "Standardmodell")}</span>
              </div>

              {modelStats && (
                <div className="absolute bottom-2.5 left-3 flex items-center gap-3 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-slate-400">
                  <span>Höjd: <strong className="text-white">{modelStats.height}m</strong></span>
                  <span>Meshar: <strong className="text-white">{modelStats.meshes}</strong></span>
                  <span>Bones: <strong className="text-white">{modelStats.bones}</strong></span>
                </div>
              )}
            </div>

            {/* Model Info & Animation Selector */}
            <div className="col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white">{char.name}</h2>
                  <span className="rounded bg-blue-600/80 px-2 py-0.5 text-[10px] font-black uppercase text-blue-100">
                    {char.tagline ?? char.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{char.blurb}</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-400">
                  <div className="rounded bg-slate-900 p-1.5 border border-slate-800">
                    <div>Fart</div>
                    <div className="text-xs text-white font-black">{char.walkSpeed}</div>
                  </div>
                  <div className="rounded bg-slate-900 p-1.5 border border-slate-800">
                    <div>Vikt</div>
                    <div className="text-xs text-white font-black">{char.weight}</div>
                  </div>
                  <div className="rounded bg-slate-900 p-1.5 border border-slate-800">
                    <div>Kastskada</div>
                    <div className="text-xs text-white font-black">{char.throwDamage}</div>
                  </div>
                </div>
              </div>

              {/* Animation Switcher Buttons */}
              <div className="mt-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Testa Skelettanimeringar ({availableAnims.length})
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {availableAnims.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Inga inbäddade animeringar hittades</span>
                  ) : (
                    availableAnims.map((anim) => (
                      <button
                        key={anim}
                        onClick={() => playAction(anim)}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                          activeAnim === anim
                            ? "bg-yellow-400 text-slate-950 shadow-[0_0_8px_#facc15]"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {anim}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Moves / Framedata Table */}
          <div className="flex-1">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2.5">
              Moveset & Framedata för {char.name}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">Attack</th>
                    <th className="p-2.5">Namn</th>
                    <th className="p-2.5">Typ</th>
                    <th className="p-2.5">Startup</th>
                    <th className="p-2.5">Active</th>
                    <th className="p-2.5">Recovery</th>
                    <th className="p-2.5">Skada</th>
                    <th className="p-2.5">Hitstun</th>
                    <th className="p-2.5">Blockstun</th>
                    <th className="p-2.5">Chip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {Object.entries(char.moves).map(([key, m]) => (
                    <tr key={key} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-black text-blue-400 uppercase">{key}</td>
                      <td className="p-2.5 font-semibold text-white">{m.name}</td>
                      <td className="p-2.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-yellow-400">{m.startup}f</td>
                      <td className="p-2.5 text-emerald-400">{m.active}f</td>
                      <td className="p-2.5 text-slate-400">{m.recovery}f</td>
                      <td className="p-2.5 font-bold text-rose-400">{m.damage}</td>
                      <td className="p-2.5">{m.hitstun}f</td>
                      <td className="p-2.5">{m.blockstun}f</td>
                      <td className="p-2.5">{m.chip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
