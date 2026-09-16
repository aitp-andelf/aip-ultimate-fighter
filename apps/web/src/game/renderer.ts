import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import type { CharacterDef } from "@aipuf/contracts";
import type { FighterRuntime, MatchState, ProjectileRuntime } from "@aipuf/sim";

export interface RendererOptions {
  container: HTMLDivElement;
  showBoxes?: boolean;
}

interface LoadedFighterState {
  group: THREE.Group;
  gltfRoot: THREE.Group | null;
  proceduralParts: FighterBodyParts | null;
  mixer: THREE.AnimationMixer | null;
  actions: Record<string, THREE.AnimationAction>;
  currentAction: THREE.AnimationAction | null;
  currentState: string;
  isGltfLoaded: boolean;
  archetype: string;
  primaryColor: string;
  secondaryColor: string;
}

interface SparkParticle {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
}

interface AmbientParticle {
  mesh: THREE.Mesh;
  baseY: number;
  baseX: number;
  speed: number;
  phase: number;
}

// Global cache for loaded GLTF scenes to avoid re-downloading
const gltfCache = new Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }>();
const gltfLoadingPromises = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>>();

export class GameRenderer {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Background & Stage
  private bgMeshBack: THREE.Mesh | null = null;
  private floorMesh: THREE.Mesh | null = null;
  private stageRimLight1: THREE.PointLight | null = null;
  private stageRimLight2: THREE.PointLight | null = null;
  private stageKeyLight: THREE.DirectionalLight | null = null;
  private stageAmbientLight: THREE.AmbientLight | null = null;
  private ambientParticles: AmbientParticle[] = [];
  private particleGroup: THREE.Group;

  // Fighters
  private fighter0: LoadedFighterState;
  private fighter1: LoadedFighterState;

  // Projectiles
  private projectilePool: Array<{
    core: THREE.Mesh;
    aura: THREE.Mesh;
    ring: THREE.Mesh;
    group: THREE.Group;
    light: THREE.PointLight;
  }> = [];

  // VFX
  private sparkGroup: THREE.Group;
  private sparks: SparkParticle[] = [];
  private screenShake = 0;
  private hitFreezeFrames = 0;
  private impactFlashMesh: THREE.Mesh | null = null;
  private impactFlashOpacity = 0;

  // Debug Box Overlays
  private debugBoxGroup: THREE.Group;
  public showBoxes = false;

  private currentStageId = "";
  private textureLoader = new THREE.TextureLoader();

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.showBoxes = options.showBoxes ?? false;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.015);

    // Camera setup
    const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.set(0, 1.8, 6.8);

    // Renderer setup with shadow maps
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Base Lighting
    this.stageAmbientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(this.stageAmbientLight);

    this.stageKeyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    this.stageKeyLight.position.set(3, 9, 6);
    this.stageKeyLight.castShadow = true;
    this.stageKeyLight.shadow.mapSize.width = 1024;
    this.stageKeyLight.shadow.mapSize.height = 1024;
    this.stageKeyLight.shadow.camera.near = 0.5;
    this.stageKeyLight.shadow.camera.far = 25;
    this.stageKeyLight.shadow.bias = -0.001;
    this.scene.add(this.stageKeyLight);

    // Groups
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.sparkGroup = new THREE.Group();
    this.scene.add(this.sparkGroup);

    this.debugBoxGroup = new THREE.Group();
    this.scene.add(this.debugBoxGroup);

    // Fighter roots
    const f0Group = new THREE.Group();
    const f1Group = new THREE.Group();
    this.scene.add(f0Group);
    this.scene.add(f1Group);

    this.fighter0 = {
      group: f0Group,
      gltfRoot: null,
      proceduralParts: null,
      mixer: null,
      actions: {},
      currentAction: null,
      currentState: "",
      isGltfLoaded: false,
      archetype: "shoto-a",
      primaryColor: "#2563eb",
      secondaryColor: "#60a5fa",
    };

    this.fighter1 = {
      group: f1Group,
      gltfRoot: null,
      proceduralParts: null,
      mixer: null,
      actions: {},
      currentAction: null,
      currentState: "",
      isGltfLoaded: false,
      archetype: "zoner-a",
      primaryColor: "#dc2626",
      secondaryColor: "#f87171",
    };

    // Build procedural models immediately as zero-latency fallback
    this.fighter0.proceduralParts = this.buildProceduralFighter(this.fighter0.group, this.fighter0.primaryColor, this.fighter0.secondaryColor);
    this.fighter1.proceduralParts = this.buildProceduralFighter(this.fighter1.group, this.fighter1.primaryColor, this.fighter1.secondaryColor);

    // Impact Flash Overlay
    const flashGeo = new THREE.PlaneGeometry(30, 20);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    this.impactFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.impactFlashMesh.position.set(0, 2, 2);
    this.impactFlashMesh.renderOrder = 999;
    this.scene.add(this.impactFlashMesh);

    // Initialize Stage
    this.setupStage("serverrum");
    this.initAmbientParticles();

    // Trigger async loading of 3D rigged GLTF models
    this.loadRiggedFighter(0, "/models/RobotExpressive.glb");
    this.loadRiggedFighter(1, "/models/RobotExpressive.glb");

    window.addEventListener("resize", this.onWindowResize);
  }

  // --- Fighter Model Setup & Async GLTF Loader ---

  public setupFighterModels(char0: CharacterDef, char1: CharacterDef): void {
    this.fighter0.archetype = char0.archetype;
    this.fighter0.primaryColor = char0.colors[0];
    this.fighter0.secondaryColor = char0.colors[1];

    this.fighter1.archetype = char1.archetype;
    this.fighter1.primaryColor = char1.colors[0];
    this.fighter1.secondaryColor = char1.colors[1];

    // Rebuild procedural fallback with character colors
    if (this.fighter0.proceduralParts) {
      this.fighter0.group.remove(this.fighter0.proceduralParts.root);
    }
    this.fighter0.proceduralParts = this.buildProceduralFighter(
      this.fighter0.group,
      char0.colors[0],
      char0.colors[1],
      char0.archetype
    );

    if (this.fighter1.proceduralParts) {
      this.fighter1.group.remove(this.fighter1.proceduralParts.root);
    }
    this.fighter1.proceduralParts = this.buildProceduralFighter(
      this.fighter1.group,
      char1.colors[0],
      char1.colors[1],
      char1.archetype
    );

    // Determine 3D model: use character custom model if available, else RobotExpressive or Xbot
    const model0 = char0.modelUrl || "/models/RobotExpressive.glb";
    const model1 = char1.modelUrl || "/models/RobotExpressive.glb";

    this.loadRiggedFighter(0, model0);
    this.loadRiggedFighter(1, model1);
  }

  private async loadRiggedFighter(slot: 0 | 1, url: string): Promise<void> {
    const fighter = slot === 0 ? this.fighter0 : this.fighter1;

    try {
      let cached = gltfCache.get(url);
      if (!cached) {
        let loadPromise = gltfLoadingPromises.get(url);
        if (!loadPromise) {
          const loader = new GLTFLoader();
          loadPromise = new Promise((resolve, reject) => {
            loader.load(
              url,
              (gltf) => {
                const data = { scene: gltf.scene, animations: gltf.animations };
                gltfCache.set(url, data);
                resolve(data);
              },
              undefined,
              (err) => reject(err)
            );
          });
          gltfLoadingPromises.set(url, loadPromise);
        }
        cached = await loadPromise;
      }

      // Clone scene with independent skeletal rig
      const clonedScene = SkeletonUtils.clone(cached.scene) as THREE.Group;

      // Customize materials with fighter colors
      const primaryCol = new THREE.Color(fighter.primaryColor);
      const secondaryCol = new THREE.Color(fighter.secondaryColor);

      clonedScene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((m: any) => m.clone());
          } else {
            child.material = child.material.clone();
          }

          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of mats) {
            mat.roughness = 0.35;
            mat.metalness = 0.35;
            const matName = (mat.name || "").toLowerCase();

            if (matName.includes("main") || matName.includes("highlimbs") || !matName) {
              mat.color = primaryCol;
              mat.emissive = primaryCol.clone().multiplyScalar(0.15);
            } else if (matName.includes("grey") || matName.includes("joints")) {
              mat.color = secondaryCol;
              mat.emissive = secondaryCol.clone().multiplyScalar(0.1);
            } else if (matName.includes("black")) {
              mat.color = new THREE.Color(0x1e293b);
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Normalize model height to 1.85m to match fighting game pushbox/hurtbox
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());
      const desiredHeight = 1.85;
      const baseScale = desiredHeight / (size.y || 1);

      // Archetype minor scaling nuances
      let archetypeScale = baseScale;
      if (fighter.archetype.startsWith("grappler")) {
        archetypeScale *= 1.12; // Bulkier grappler silhouette
      }

      clonedScene.scale.set(archetypeScale, archetypeScale, archetypeScale);

      // Align bottom of feet with ground (y = 0)
      const feetY = box.min.y * archetypeScale;
      clonedScene.position.y = -feetY;

      // Setup AnimationMixer
      const mixer = new THREE.AnimationMixer(clonedScene);
      const actions: Record<string, THREE.AnimationAction> = {};
      for (const clip of cached.animations) {
        actions[clip.name.toLowerCase()] = mixer.clipAction(clip);
      }

      // Remove existing gltf root if any
      if (fighter.gltfRoot) {
        fighter.group.remove(fighter.gltfRoot);
      }

      fighter.gltfRoot = clonedScene;
      fighter.mixer = mixer;
      fighter.actions = actions;
      fighter.isGltfLoaded = true;
      fighter.group.add(clonedScene);

      // Hide procedural parts once real 3D rigged model is ready
      if (fighter.proceduralParts) {
        fighter.proceduralParts.root.visible = false;
      }
    } catch {
      // In offline / fallback environment, procedural model stays active seamlessly
      fighter.isGltfLoaded = false;
      if (fighter.proceduralParts) {
        fighter.proceduralParts.root.visible = true;
      }
    }
  }

  // --- Dynamic Stage Setup ---

  public setupStage(stageId: string): void {
    if (this.currentStageId === stageId && this.bgMeshBack) return;
    this.currentStageId = stageId;

    if (this.bgMeshBack) this.scene.remove(this.bgMeshBack);
    if (this.floorMesh) this.scene.remove(this.floorMesh);

    // Configure stage-specific atmospheric lighting & fog
    if (stageId === "serverrum") {
      this.scene.fog = new THREE.FogExp2(0x040814, 0.018);
      if (this.stageAmbientLight) this.stageAmbientLight.color.setHex(0x94a3b8);
      if (this.stageKeyLight) {
        this.stageKeyLight.color.setHex(0xe0f2fe);
        this.stageKeyLight.intensity = 2.5;
      }
      this.updateRimLights(0x06b6d4, 0x10b981, 2.5, 2.0);
    } else if (stageId === "fikarum") {
      this.scene.fog = new THREE.FogExp2(0x1a120c, 0.015);
      if (this.stageAmbientLight) this.stageAmbientLight.color.setHex(0xfde68a);
      if (this.stageKeyLight) {
        this.stageKeyLight.color.setHex(0xffedd5);
        this.stageKeyLight.intensity = 2.6;
      }
      this.updateRimLights(0xf59e0b, 0xd97706, 2.2, 1.8);
    } else if (stageId === "kontor") {
      this.scene.fog = new THREE.FogExp2(0x041122, 0.016);
      if (this.stageAmbientLight) this.stageAmbientLight.color.setHex(0xa5f3fc);
      if (this.stageKeyLight) {
        this.stageKeyLight.color.setHex(0xffffff);
        this.stageKeyLight.intensity = 2.4;
      }
      this.updateRimLights(0x0ea5e9, 0xf97316, 2.8, 2.2);
    } else {
      // Konferens
      this.scene.fog = new THREE.FogExp2(0x0c071e, 0.016);
      if (this.stageAmbientLight) this.stageAmbientLight.color.setHex(0xc4b5fd);
      if (this.stageKeyLight) {
        this.stageKeyLight.color.setHex(0xffffff);
        this.stageKeyLight.intensity = 2.5;
      }
      this.updateRimLights(0x8b5cf6, 0xeab308, 2.8, 2.0);
    }

    // High-Resolution Stage Floor with reflections
    const floorGeo = new THREE.PlaneGeometry(36, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: stageId === "fikarum" ? 0x27272a : stageId === "konferens" ? 0x09090b : 0x0f172a,
      roughness: 0.25,
      metalness: 0.65,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 0);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Large Stage Backdrop Plane loading the cinematic AI image
    const backGeo = new THREE.PlaneGeometry(34, 17);
    const stageImageUrl = `/stages/${stageId}.jpg`;

    this.textureLoader.load(
      stageImageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const backMat = new THREE.MeshBasicMaterial({
          map: texture,
        });

        if (this.bgMeshBack) this.scene.remove(this.bgMeshBack);
        this.bgMeshBack = new THREE.Mesh(backGeo, backMat);
        this.bgMeshBack.position.set(0, 6.0, -6.8);
        this.scene.add(this.bgMeshBack);
      },
      undefined,
      () => {
        // Fallback procedural canvas texture if image not accessible
        const canvasTex = this.createFallbackStageTexture(stageId);
        const backMat = new THREE.MeshBasicMaterial({ map: canvasTex });
        if (this.bgMeshBack) this.scene.remove(this.bgMeshBack);
        this.bgMeshBack = new THREE.Mesh(backGeo, backMat);
        this.bgMeshBack.position.set(0, 6.0, -6.8);
        this.scene.add(this.bgMeshBack);
      }
    );
  }

  private updateRimLights(color1: number, color2: number, int1: number, int2: number): void {
    if (!this.stageRimLight1) {
      this.stageRimLight1 = new THREE.PointLight(color1, int1, 15);
      this.stageRimLight1.position.set(-5, 3, 2);
      this.scene.add(this.stageRimLight1);
    } else {
      this.stageRimLight1.color.setHex(color1);
      this.stageRimLight1.intensity = int1;
    }

    if (!this.stageRimLight2) {
      this.stageRimLight2 = new THREE.PointLight(color2, int2, 15);
      this.stageRimLight2.position.set(5, 3, 2);
      this.scene.add(this.stageRimLight2);
    } else {
      this.stageRimLight2.color.setHex(color2);
      this.stageRimLight2.intensity = int2;
    }
  }

  // --- Ambient Atmospheric Particles ---

  private initAmbientParticles(): void {
    const pGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < 45; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      const baseX = (Math.random() - 0.5) * 24;
      const baseY = 0.5 + Math.random() * 4.5;
      const baseZ = (Math.random() - 0.5) * 6;

      mesh.position.set(baseX, baseY, baseZ);
      this.particleGroup.add(mesh);

      this.ambientParticles.push({
        mesh,
        baseX,
        baseY,
        speed: 0.005 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private updateAmbientParticles(): void {
    const t = performance.now() * 0.001;
    for (const p of this.ambientParticles) {
      p.mesh.position.y = p.baseY + Math.sin(t * 1.2 + p.phase) * 0.4;
      p.mesh.position.x = p.baseX + Math.cos(t * 0.8 + p.phase) * 0.3;
    }
  }

  // --- Main Render Loop (called per animation frame or simulation tick) ---

  public renderMatch(state: MatchState): void {
    const dt = this.clock.getDelta();
    const f0 = state.fighters[0];
    const f1 = state.fighters[1];

    // Subunit to meter conversion (1000 subunits = 1 meter)
    const pos0X = f0.x / 1000;
    const pos0Y = f0.y / 1000;
    const pos1X = f1.x / 1000;
    const pos1Y = f1.y / 1000;

    this.fighter0.group.position.set(pos0X, pos0Y, 0);
    this.fighter0.group.scale.set(f0.facing, 1, 1);

    this.fighter1.group.position.set(pos1X, pos1Y, 0);
    this.fighter1.group.scale.set(f1.facing, 1, 1);

    // Hit-stop freeze frame check
    const isFrozen = this.hitFreezeFrames > 0;
    if (this.hitFreezeFrames > 0) {
      this.hitFreezeFrames--;
    }

    // Animate fighters
    this.updateFighterAnimation(this.fighter0, f0, isFrozen ? 0 : dt);
    this.updateFighterAnimation(this.fighter1, f1, isFrozen ? 0 : dt);

    // Camera follow midpoint with Street Fighter framing
    const midX = (pos0X + pos1X) / 2;
    const dist = Math.abs(pos0X - pos1X);
    const targetCamX = midX;
    const targetCamZ = Math.max(5.2, Math.min(8.2, 4.8 + dist * 0.68));
    const targetCamY = 1.7 + Math.max(pos0Y, pos1Y) * 0.25;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.12;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.12;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.12;

    // Apply Screen Shake
    if (this.screenShake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake;
      this.screenShake *= 0.85;
    } else {
      this.screenShake = 0;
    }

    this.camera.lookAt(this.camera.position.x, 1.45, 0);

    // Subtle parallax shift for background backdrop
    if (this.bgMeshBack) {
      this.bgMeshBack.position.x = this.camera.position.x * 0.12;
    }

    // Render projectiles with signature character styling
    this.renderProjectiles(state.projectiles, state.chars);

    // Subtle full-meter aura sparks
    if (f0.meter >= 1000 && Math.random() < 0.35) {
      this.spawnSparks(pos0X + (Math.random() - 0.5) * 0.35, pos0Y + 0.15, 0xf59e0b, 1, 0.05);
    }
    if (f1.meter >= 1000 && Math.random() < 0.35) {
      this.spawnSparks(pos1X + (Math.random() - 0.5) * 0.35, pos1Y + 0.15, 0xf59e0b, 1, 0.05);
    }

    // Process simulation events (hits, blocks, supers, knockouts)
    for (const ev of state.events) {
      if (ev.kind === "hit") {
        const victim = ev.source === 0 ? f1 : f0;
        const vx = victim.x / 1000;
        const vy = victim.y / 1000 + 1.15;
        this.spawnSparks(vx, vy, 0xffbb00, 18, 0.14);
        this.spawnSparks(vx, vy, 0xff4400, 10, 0.09);
        this.screenShake = Math.max(this.screenShake, 0.12);
        this.triggerImpactFlash(0.25);
        this.hitFreezeFrames = 3; // 3-frame hit stop punch
      } else if (ev.kind === "block") {
        const blocker = ev.source === 0 ? f0 : f1;
        const bx = blocker.x / 1000;
        const by = blocker.y / 1000 + 1.2;
        this.spawnSparks(bx, by, 0x38bdf8, 12, 0.1);
        this.spawnSparks(bx, by, 0xffffff, 6, 0.08);
        this.screenShake = Math.max(this.screenShake, 0.04);
      } else if (ev.kind === "super") {
        const user = ev.source === 0 ? f0 : f1;
        const char = state.chars[ev.source];
        const charId = char ? char.id : "shoto-a";
        const ux = user.x / 1000;
        const uy = user.y / 1000 + 1.0;

        // Character-specific signature super burst
        if (charId === "grappler-a") {
          // Capitan Hulk Mode Super (Blue Thunder Ground Shockwaves)
          this.spawnSparks(ux, uy, 0x1d4ed8, 40, 0.28);
          this.spawnSparks(ux, uy, 0x60a5fa, 25, 0.20);
        } else if (charId === "shoto-a") {
          // Irstababben Irsta Speciale (Pizza Oven Inferno Burst)
          this.spawnSparks(ux, uy, 0xf59e0b, 40, 0.26);
          this.spawnSparks(ux, uy, 0xef4444, 25, 0.20);
        } else if (charId === "grappler-b") {
          // Babas Perfect Vision (Surgical Laser Flash)
          this.spawnSparks(ux, uy, 0xe11d48, 40, 0.30);
          this.spawnSparks(ux, uy, 0xffffff, 25, 0.25);
        } else if (charId === "zoner-a") {
          // Femboyfippe OVERDRIVE (High Voltage Cyan Cascade)
          this.spawnSparks(ux, uy, 0x06b6d4, 40, 0.26);
          this.spawnSparks(ux, uy, 0x38bdf8, 25, 0.20);
        } else if (charId === "zoner-b") {
          // Stinkfiend BIOHAZARD (Noxious Venom Cloud)
          this.spawnSparks(ux, uy, 0x84cc16, 40, 0.22);
          this.spawnSparks(ux, uy, 0x15803d, 25, 0.18);
        } else if (charId === "shoto-b") {
          // Goonström MAXIMUM GOON (Abyssal Void Shockwave)
          this.spawnSparks(ux, uy, 0x581c87, 40, 0.28);
          this.spawnSparks(ux, uy, 0xd946ef, 25, 0.22);
        } else if (charId === "hybrid-a") {
          // Ekander TERMINAL VELOCITY (Kinetic Momentum Blast)
          this.spawnSparks(ux, uy, 0x7c3aed, 40, 0.26);
          this.spawnSparks(ux, uy, 0xc084fc, 25, 0.20);
        } else {
          // Bulgarian Copper Thief THE GRID IS MINE (Electrified Copper Arc Storm)
          this.spawnSparks(ux, uy, 0xd97706, 40, 0.26);
          this.spawnSparks(ux, uy, 0x14b8a6, 25, 0.20);
        }

        this.screenShake = Math.max(this.screenShake, 0.35);
        this.triggerImpactFlash(0.65);
        this.hitFreezeFrames = 6;
      } else if (ev.kind === "ko") {
        this.screenShake = Math.max(this.screenShake, 0.45);
        this.triggerImpactFlash(0.5);
      }
    }

    // Update VFX & Particles
    this.updateSparks();
    this.updateAmbientParticles();
    this.updateImpactFlash();

    // Render debug boxes if toggled
    if (this.showBoxes) {
      this.renderDebugBoxes(state);
    } else {
      this.debugBoxGroup.clear();
    }

    this.renderer.render(this.scene, this.camera);
  }

  // --- Fighter Animation Driving ---

  private updateFighterAnimation(fighter: LoadedFighterState, runtime: FighterRuntime, dt: number): void {
    if (fighter.isGltfLoaded && fighter.mixer) {
      // Drive skeletal animation mixer
      fighter.mixer.update(dt);
      this.playRiggedAnimation(fighter, runtime.state, runtime.moveId);
    } else if (fighter.proceduralParts) {
      // Fallback: drive procedural skeleton
      this.poseProceduralFighter(fighter.proceduralParts, runtime);
    }
  }

  private playRiggedAnimation(fighter: LoadedFighterState, state: string, moveId: string | null = null): void {
    const stateKey = `${state}:${moveId || ""}`;
    if (fighter.currentState === stateKey) return;
    fighter.currentState = stateKey;

    const findAction = (...names: string[]) => {
      for (const name of names) {
        const act = fighter.actions[name.toLowerCase()];
        if (act) return act;
      }
      return null;
    };

    let targetAction: THREE.AnimationAction | null = null;
    let timeScale = 1.0;

    switch (state) {
      case "idle":
        targetAction = findAction("idle", "standing");
        break;
      case "walkForward":
        targetAction = findAction("walking", "walk", "running");
        break;
      case "walkBackward":
        targetAction = findAction("walking", "walk");
        timeScale = -0.75;
        break;
      case "dash":
        targetAction = findAction("running", "run", "walking");
        timeScale = 1.3;
        break;
      case "crouch":
      case "crouchBlock":
        targetAction = findAction("sitting", "sneak_pose", "idle");
        break;
      case "jump":
      case "fall":
        targetAction = findAction("jump", "walkjump");
        break;
      case "standBlock":
        targetAction = findAction("no", "headshake", "idle");
        break;
      case "attackStartup":
      case "attackActive":
      case "attackRecovery": {
        const move = moveId || "";
        const isKick = move === "lk" || move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot") || move.includes("shin") || move.includes("heel");
        const isSuper = move.includes("super") || move.includes("overdrive") || move.includes("biohazard") || move.includes("velocity") || move.includes("grid");

        if (isSuper) {
          targetAction = findAction("thumbsup", "dance", "agree", "punch");
          timeScale = 1.6;
        } else if (isKick) {
          targetAction = findAction("running", "walkjump", "jump", "punch");
          timeScale = 1.7;
        } else {
          targetAction = findAction("punch", "agree", "running");
          timeScale = 1.5;
        }
        break;
      }
      case "hitstun":
        targetAction = findAction("no", "headshake");
        timeScale = 1.5;
        break;
      case "knockdown":
      case "ko":
        targetAction = findAction("death", "sad_pose");
        if (targetAction) {
          targetAction.clampWhenFinished = true;
          targetAction.loop = THREE.LoopOnce;
        }
        break;
      case "victory":
        targetAction = findAction("dance", "thumbsup", "wave", "agree");
        break;
      default:
        targetAction = findAction("idle");
    }

    if (targetAction && targetAction !== fighter.currentAction) {
      if (fighter.currentAction) {
        fighter.currentAction.fadeOut(0.08);
      }
      targetAction.reset().setEffectiveTimeScale(timeScale).fadeIn(0.08).play();
      fighter.currentAction = targetAction;
    }
  }

  // --- Procedural Fallback Rig ---

  private buildProceduralFighter(
    parent: THREE.Group,
    primaryColor: string,
    secondaryColor: string,
    archetype: string = "shoto-a"
  ): FighterBodyParts {
    const pMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.35,
      metalness: 0.3,
    });
    const sMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.45,
      metalness: 0.2,
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
    });

    const root = new THREE.Group();
    parent.add(root);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.48, 0.24);
    const torso = new THREE.Mesh(torsoGeo, pMat);
    torso.position.set(0, 1.15, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const head = new THREE.Mesh(headGeo, sMat);
    head.position.set(0, 0.4, 0);
    head.castShadow = true;
    torso.add(head);

    // Visor/eyes
    const visorGeo = new THREE.BoxGeometry(0.2, 0.06, 0.08);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0.08, 0, 0.12);
    head.add(visor);

    // Left Arm (Back arm)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0, 0.18, -0.18);
    torso.add(leftArmGroup);

    const upperArmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.28, 8);
    const lUpperArm = new THREE.Mesh(upperArmGeo, sMat);
    lUpperArm.position.set(0, -0.14, 0);
    lUpperArm.castShadow = true;
    leftArmGroup.add(lUpperArm);

    const lForearmGroup = new THREE.Group();
    lForearmGroup.position.set(0, -0.26, 0);
    leftArmGroup.add(lForearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8);
    const lForearm = new THREE.Mesh(forearmGeo, pMat);
    lForearm.position.set(0, -0.13, 0);
    lForearm.castShadow = true;
    lForearmGroup.add(lForearm);

    // Right Arm (Front arm)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0, 0.18, 0.18);
    torso.add(rightArmGroup);

    const rUpperArm = new THREE.Mesh(upperArmGeo, sMat);
    rUpperArm.position.set(0, -0.14, 0);
    rUpperArm.castShadow = true;
    rightArmGroup.add(rUpperArm);

    const rForearmGroup = new THREE.Group();
    rForearmGroup.position.set(0, -0.26, 0);
    rightArmGroup.add(rForearmGroup);

    const rForearm = new THREE.Mesh(forearmGeo, pMat);
    rForearm.position.set(0, -0.13, 0);
    rForearm.castShadow = true;
    rForearmGroup.add(rForearm);

    // Pelvis
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.22), jointMat);
    pelvis.position.set(0, -0.3, 0);
    pelvis.castShadow = true;
    torso.add(pelvis);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0, -0.08, -0.11);
    pelvis.add(leftLegGroup);

    const thighGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.38, 8);
    const lThigh = new THREE.Mesh(thighGeo, pMat);
    lThigh.position.set(0, -0.19, 0);
    lThigh.castShadow = true;
    leftLegGroup.add(lThigh);

    const lShinGroup = new THREE.Group();
    lShinGroup.position.set(0, -0.36, 0);
    leftLegGroup.add(lShinGroup);

    const shinGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.38, 8);
    const lShin = new THREE.Mesh(shinGeo, sMat);
    lShin.position.set(0, -0.19, 0);
    lShin.castShadow = true;
    lShinGroup.add(lShin);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0, -0.08, 0.11);
    pelvis.add(rightLegGroup);

    const rThigh = new THREE.Mesh(thighGeo, pMat);
    rThigh.position.set(0, -0.19, 0);
    rThigh.castShadow = true;
    rightLegGroup.add(rThigh);

    const rShinGroup = new THREE.Group();
    rShinGroup.position.set(0, -0.36, 0);
    rightLegGroup.add(rShinGroup);

    const rShin = new THREE.Mesh(shinGeo, sMat);
    rShin.position.set(0, -0.19, 0);
    rShin.castShadow = true;
    rShinGroup.add(rShin);

    if (archetype.startsWith("grappler")) {
      const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), sMat);
      shoulderPad.position.set(0, 0.1, 0);
      rightArmGroup.add(shoulderPad);
    }

    return {
      root,
      torso,
      head,
      leftArm: leftArmGroup,
      leftForearm: lForearmGroup,
      rightArm: rightArmGroup,
      rightForearm: rForearmGroup,
      leftLeg: leftLegGroup,
      leftShin: lShinGroup,
      rightLeg: rightLegGroup,
      rightShin: rShinGroup,
    };
  }

  private poseProceduralFighter(parts: FighterBodyParts, fighter: FighterRuntime): void {
    const t = fighter.stateTime * 0.15;

    // Reset rotations
    parts.torso.rotation.set(0, 0, 0);
    parts.head.rotation.set(0, 0, 0);
    parts.leftArm.rotation.set(0, 0, 0);
    parts.leftForearm.rotation.set(0, 0, 0);
    parts.rightArm.rotation.set(0, 0, 0);
    parts.rightForearm.rotation.set(0, 0, 0);
    parts.leftLeg.rotation.set(0, 0, 0);
    parts.leftShin.rotation.set(0, 0, 0);
    parts.rightLeg.rotation.set(0, 0, 0);
    parts.rightShin.rotation.set(0, 0, 0);
    parts.root.position.y = 0;

    switch (fighter.state) {
      case "idle": {
        const sway = Math.sin(t * 1.5) * 0.05;
        parts.torso.position.y = 1.15 + sway;
        parts.rightArm.rotation.z = 0.5 + sway;
        parts.rightForearm.rotation.z = -0.8;
        parts.leftArm.rotation.z = 0.3;
        parts.leftForearm.rotation.z = -0.7;
        parts.rightLeg.rotation.z = 0.2;
        parts.leftLeg.rotation.z = -0.2;
        break;
      }
      case "walkForward": {
        const walkCycle = Math.sin(t * 3);
        parts.rightLeg.rotation.z = walkCycle * 0.6;
        parts.leftLeg.rotation.z = -walkCycle * 0.6;
        parts.rightArm.rotation.z = -walkCycle * 0.5;
        parts.leftArm.rotation.z = walkCycle * 0.5;
        break;
      }
      case "walkBackward": {
        const walkCycle = Math.sin(t * 2.5);
        parts.rightLeg.rotation.z = -walkCycle * 0.5;
        parts.leftLeg.rotation.z = walkCycle * 0.5;
        parts.rightArm.rotation.z = 0.8;
        parts.rightForearm.rotation.z = -1.2;
        break;
      }
      case "crouch":
      case "crouchBlock": {
        parts.root.position.y = -0.25;
        parts.torso.rotation.z = 0.25;
        parts.rightLeg.rotation.z = 0.8;
        parts.rightShin.rotation.z = -1.2;
        parts.leftLeg.rotation.z = 0.8;
        parts.leftShin.rotation.z = -1.2;
        parts.rightArm.rotation.z = 0.9;
        parts.rightForearm.rotation.z = -1.4;
        break;
      }
      case "jump":
      case "fall": {
        parts.rightLeg.rotation.z = 0.6;
        parts.rightShin.rotation.z = -0.8;
        parts.leftLeg.rotation.z = -0.4;
        parts.rightArm.rotation.z = -1.0;
        parts.leftArm.rotation.z = -0.6;
        break;
      }
      case "standBlock": {
        parts.torso.rotation.z = -0.15;
        parts.rightArm.rotation.z = 1.2;
        parts.rightForearm.rotation.z = -1.6;
        parts.leftArm.rotation.z = 1.0;
        parts.leftForearm.rotation.z = -1.5;
        break;
      }
      case "hitstun": {
        parts.torso.rotation.z = -0.5;
        parts.head.rotation.z = -0.4;
        parts.rightArm.rotation.z = -0.8;
        parts.leftArm.rotation.z = -0.6;
        break;
      }
      case "knockdown": {
        parts.root.position.y = -0.7;
        parts.root.rotation.x = -Math.PI / 2;
        break;
      }
      case "victory": {
        parts.torso.position.y = 1.2;
        parts.rightArm.rotation.z = 2.8;
        parts.leftArm.rotation.z = 0.3;
        break;
      }
      case "ko": {
        parts.root.position.y = -0.85;
        parts.root.rotation.x = Math.PI / 2;
        break;
      }
      case "attackStartup": {
        const move = fighter.moveId || "";
        const isKick = move === "lk" || move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot") || move.includes("shin") || move.includes("heel");
        const isHeavy = move === "hp" || move === "hk" || move.includes("hammer") || move.includes("smash") || move.includes("axe") || move.includes("haymaker");

        if (isKick) {
          parts.torso.rotation.z = -0.2;
          parts.rightLeg.rotation.z = -0.4;
          parts.rightShin.rotation.z = -0.8;
          parts.rightArm.rotation.z = 0.5;
          parts.leftArm.rotation.z = 0.4;
        } else {
          parts.torso.rotation.z = isHeavy ? -0.4 : -0.2;
          parts.rightArm.rotation.z = isHeavy ? -0.9 : -0.6;
          parts.rightForearm.rotation.z = -0.9;
        }
        break;
      }
      case "attackActive": {
        const move = fighter.moveId || "";
        const isKickA = move === "lk";
        const isKickB = move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot") || move.includes("shin") || move.includes("heel");
        const isPunchA = move === "lp";
        const isPunchB = move === "hp" || move.includes("hammer") || move.includes("smash") || move.includes("backhand") || move.includes("haymaker") || move.includes("slap");
        const isThrow = move === "throw" || move.includes("grab") || move.includes("suplex");
        const isSuper = move.includes("super") || move.includes("overdrive") || move.includes("biohazard") || move.includes("velocity") || move.includes("grid");

        if (fighter.airborne) {
          // Air attack: Dynamic aerial dive/kick
          parts.torso.rotation.z = 0.35;
          parts.rightLeg.rotation.z = 1.3;
          parts.rightShin.rotation.z = 0.2;
          parts.leftLeg.rotation.z = -0.7;
          parts.leftShin.rotation.z = -0.9;
          parts.rightArm.rotation.z = 1.2;
          parts.leftArm.rotation.z = -0.5;
        } else if (isThrow) {
          // Grapple / Command Grab: Both hands lunging forward
          parts.torso.rotation.z = 0.35;
          parts.rightArm.rotation.z = 1.4;
          parts.rightForearm.rotation.z = 0.3;
          parts.leftArm.rotation.z = 1.3;
          parts.leftForearm.rotation.z = 0.3;
          parts.rightLeg.rotation.z = 0.4;
          parts.leftLeg.rotation.z = -0.4;
        } else if (isSuper) {
          // Super Arts: Full-body explosive kinetic surge
          parts.torso.rotation.z = 0.4;
          parts.head.rotation.z = -0.2;
          parts.rightArm.rotation.z = 1.6;
          parts.rightForearm.rotation.z = 0.1;
          parts.leftArm.rotation.z = -0.8;
          parts.leftForearm.rotation.z = -0.6;
          parts.rightLeg.rotation.z = 0.6;
          parts.leftLeg.rotation.z = -0.7;
        } else if (isKickB) {
          // Kick B (Heavy): High sweeping roundhouse / axe kick
          parts.torso.rotation.z = -0.25;
          parts.rightLeg.rotation.z = 1.7;
          parts.rightShin.rotation.z = 0.2;
          parts.leftLeg.rotation.z = -0.4;
          parts.leftShin.rotation.z = -0.6;
          parts.rightArm.rotation.z = -0.4;
          parts.leftArm.rotation.z = 0.8;
        } else if (isKickA) {
          // Kick A (Fast): Snapping low/mid poke
          parts.torso.rotation.z = -0.12;
          parts.rightLeg.rotation.z = 1.15;
          parts.rightShin.rotation.z = 0.1;
          parts.leftLeg.rotation.z = -0.3;
          parts.leftShin.rotation.z = -0.3;
          parts.rightArm.rotation.z = 0.6;
          parts.leftArm.rotation.z = 0.7;
        } else if (isPunchB) {
          // Punch B (Heavy): Heavy overhead smash / hammer / haymaker
          parts.torso.rotation.z = 0.55;
          parts.rightArm.rotation.z = 1.7;
          parts.rightForearm.rotation.z = -0.15;
          parts.leftArm.rotation.z = -0.6;
          parts.leftForearm.rotation.z = -0.5;
          parts.rightLeg.rotation.z = 0.6;
          parts.leftLeg.rotation.z = -0.6;
        } else {
          // Punch A (Fast): Clean straight jab
          parts.torso.rotation.z = 0.2;
          parts.rightArm.rotation.z = 1.45;
          parts.rightForearm.rotation.z = 0.05;
          parts.leftArm.rotation.z = 0.7;
          parts.leftForearm.rotation.z = -1.2;
          parts.rightLeg.rotation.z = 0.35;
          parts.leftLeg.rotation.z = -0.35;
        }
        break;
      }
      case "attackRecovery": {
        const move = fighter.moveId || "";
        const isKick = move === "lk" || move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot") || move.includes("shin") || move.includes("heel");
        if (isKick) {
          parts.torso.rotation.z = -0.05;
          parts.rightLeg.rotation.z = 0.5;
          parts.rightShin.rotation.z = -0.4;
          parts.leftLeg.rotation.z = -0.2;
        } else {
          parts.torso.rotation.z = 0.1;
          parts.rightArm.rotation.z = 0.8;
          parts.rightForearm.rotation.z = -0.6;
        }
        break;
      }
    }
  }

  // --- Projectiles with Energy Glow & Signature VFX ---

  private renderProjectiles(projectiles: ProjectileRuntime[], chars: [CharacterDef, CharacterDef]): void {
    while (this.projectilePool.length < projectiles.length) {
      const group = new THREE.Group();

      const coreGeo = new THREE.SphereGeometry(0.18, 14, 14);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      const auraGeo = new THREE.SphereGeometry(0.32, 14, 14);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      group.add(aura);

      const ringGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 20);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      const light = new THREE.PointLight(0x38bdf8, 2.5, 3.5);
      group.add(light);

      this.scene.add(group);
      this.projectilePool.push({ core, aura, ring, group, light });
    }

    for (let i = 0; i < this.projectilePool.length; i++) {
      const entry = this.projectilePool[i]!;
      if (i < projectiles.length) {
        const p = projectiles[i]!;
        entry.group.visible = true;
        entry.group.position.set(p.x / 1000, p.y / 1000, 0.1);

        const ownerChar = chars[p.owner];
        const charId = ownerChar ? ownerChar.id : "shoto-a";

        let coreColor = 0x38bdf8;
        let auraColor = 0x0284c7;
        let ringColor = 0x67e8f9;
        let lightColor = 0x38bdf8;

        if (charId === "shoto-a") {
          // Irstababben: Hawaii Pineapple Blast & Oven Fire
          coreColor = 0xf97316;
          auraColor = 0xfde047;
          ringColor = 0xf59e0b;
          lightColor = 0xf97316;
          entry.core.scale.set(1.2, 1.2, 1.2);
          entry.aura.scale.set(1.6, 1.6, 1.6);
          entry.ring.scale.set(1.4, 1.4, 1.4);
          entry.group.rotation.z += 0.25;
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0xfbbf24, 2, 0.05);
          }
        } else if (charId === "grappler-b") {
          // Babas: LASIK Laser Beam (horizontally stretched needle-thin laser)
          coreColor = 0xffffff;
          auraColor = 0xe11d48;
          ringColor = 0x06b6d4;
          lightColor = 0xf43f5e;
          entry.core.scale.set(2.8, 0.3, 0.3);
          entry.aura.scale.set(3.4, 0.55, 0.55);
          entry.ring.scale.set(0.6, 0.6, 0.6);
          if (p.life % 2 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0xe11d48, 2, 0.06);
          }
        } else if (charId === "zoner-a") {
          // Femboyfippe: Cardiac Grid Electric Node
          coreColor = 0x22d3ee;
          auraColor = 0x38bdf8;
          ringColor = 0xa855f7;
          lightColor = 0x06b6d4;
          entry.core.scale.set(1.0, 1.0, 1.0);
          entry.aura.scale.set(1.4, 1.4, 1.4);
          entry.ring.scale.set(1.8, 1.8, 1.8);
          entry.ring.rotation.y += 0.3;
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0x22d3ee, 3, 0.08);
          }
        } else if (charId === "zoner-b") {
          // Stinkfiend: Silent But Deadly Biohazard Poison Cloud
          coreColor = 0x84cc16;
          auraColor = 0x22c55e;
          ringColor = 0x15803d;
          lightColor = 0x84cc16;
          entry.core.scale.set(1.6, 1.6, 1.2);
          entry.aura.scale.set(2.4, 2.4, 1.5);
          entry.ring.scale.set(1.6, 1.6, 1.6);
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000 + 0.1, 0x84cc16, 2, 0.03);
          }
        } else if (charId === "shoto-b") {
          // Goonström: Goon Blast (Abyssal Dark Purple & Magenta Void)
          coreColor = 0x3b0764;
          auraColor = 0xd946ef;
          ringColor = 0x7e22ce;
          lightColor = 0xa855f7;
          entry.core.scale.set(1.3, 1.3, 1.3);
          entry.aura.scale.set(1.8, 1.8, 1.8);
          entry.ring.scale.set(1.5, 1.5, 1.5);
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0xd946ef, 3, 0.06);
          }
        } else if (charId === "hybrid-a") {
          // Ekander: Ekander Roll / Kinetic Mass
          coreColor = 0x7c3aed;
          auraColor = 0xc084fc;
          ringColor = 0xa855f7;
          lightColor = 0x8b5cf6;
          entry.core.scale.set(1.5, 1.5, 1.5);
          entry.aura.scale.set(1.9, 1.9, 1.9);
          entry.ring.scale.set(1.6, 1.6, 1.6);
          entry.group.rotation.z += p.facing * 0.3;
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0xa855f7, 2, 0.05);
          }
        } else if (charId === "hybrid-b") {
          // Bulgarian Copper Thief: Copper Wire / Lightning Strike
          coreColor = 0xea580c;
          auraColor = 0x14b8a6;
          ringColor = 0xf59e0b;
          lightColor = 0x2dd4bf;
          entry.core.scale.set(1.4, 1.4, 1.4);
          entry.aura.scale.set(1.8, 1.8, 1.8);
          entry.ring.scale.set(1.6, 1.6, 1.6);
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0x14b8a6, 2, 0.07);
            this.spawnSparks(p.x / 1000, p.y / 1000, 0xea580c, 1, 0.06);
          }
        } else {
          // Capitan: Blue Thunder Ground Shockwave
          coreColor = 0x1d4ed8;
          auraColor = 0x60a5fa;
          ringColor = 0x3b82f6;
          lightColor = 0x60a5fa;
          entry.core.scale.set(1.5, 1.5, 1.5);
          entry.aura.scale.set(2.0, 2.0, 2.0);
          entry.ring.scale.set(2.0, 2.0, 2.0);
          if (p.life % 3 === 0) {
            this.spawnSparks(p.x / 1000, p.y / 1000, 0x60a5fa, 3, 0.07);
          }
        }

        // Zone specialization: Towering ground hazard barrier
        if (p.kind === "zone") {
          entry.core.scale.set(1.5, 3.2, 0.8);
          entry.aura.scale.set(2.0, 3.8, 1.2);
          entry.ring.scale.set(2.2, 2.2, 2.2);
        }

        (entry.core.material as THREE.MeshBasicMaterial).color.setHex(coreColor);
        (entry.aura.material as THREE.MeshBasicMaterial).color.setHex(auraColor);
        (entry.ring.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
        entry.light.color.setHex(lightColor);
      } else {
        entry.group.visible = false;
      }
    }
  }

  // --- High-Velocity Additive Sparks & Impact Flash ---

  private spawnSparks(x: number, y: number, colorHex: number, count: number, speedScale = 0.12): void {
    const geo = new THREE.PlaneGeometry(0.09, 0.09);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0.15);
      this.sparkGroup.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = speedScale * (0.5 + Math.random() * 0.9);

      this.sparks.push({
        mesh,
        life: 0,
        maxLife: 10 + Math.random() * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * speed * 0.5,
        rotSpeed: (Math.random() - 0.5) * 0.4,
      });
    }
  }

  private updateSparks(): void {
    const alive: SparkParticle[] = [];
    for (const s of this.sparks) {
      s.life++;
      s.mesh.position.x += s.vx;
      s.mesh.position.y += s.vy;
      s.mesh.position.z += s.vz;
      s.mesh.rotation.z += s.rotSpeed;

      const progress = s.life / s.maxLife;
      const scale = 1 - progress;
      s.mesh.scale.set(scale, scale, 1);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;

      if (s.life < s.maxLife) {
        alive.push(s);
      } else {
        this.sparkGroup.remove(s.mesh);
      }
    }
    this.sparks = alive;
  }

  private triggerImpactFlash(opacity = 0.3): void {
    this.impactFlashOpacity = opacity;
  }

  private updateImpactFlash(): void {
    if (this.impactFlashMesh) {
      if (this.impactFlashOpacity > 0.01) {
        (this.impactFlashMesh.material as THREE.MeshBasicMaterial).opacity = this.impactFlashOpacity;
        this.impactFlashMesh.visible = true;
        this.impactFlashOpacity *= 0.7; // Fast decay
      } else {
        this.impactFlashMesh.visible = false;
      }
    }
  }

  // --- Debug Boxes (Pushbox, Hurtbox, Hitbox) ---

  private renderDebugBoxes(state: MatchState): void {
    this.debugBoxGroup.clear();

    const lineMatRed = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const lineMatGreen = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const lineMatYellow = new THREE.LineBasicMaterial({ color: 0xffff00 });

    for (let i = 0; i < 2; i++) {
      const f = state.fighters[i]!;
      const char = state.chars[i]!;

      // Pushbox (yellow)
      const pw = char.pushbox.w / 1000;
      const ph = char.pushbox.h / 1000;
      const px = f.x / 1000;
      const py = f.y / 1000 + ph / 2;
      this.drawBoxOutline(px, py, pw, ph, lineMatYellow);

      // Hurtboxes (green)
      const hurt = f.y > 0 ? char.hurtAir : f.state === "crouch" ? char.hurtCrouch : char.hurtStand;
      for (const b of hurt) {
        const bw = b.w / 1000;
        const bh = b.h / 1000;
        const bx = f.x / 1000 + (f.facing === 1 ? b.x / 1000 + bw / 2 : -(b.x / 1000 + bw / 2));
        const by = f.y / 1000 + b.y / 1000 + bh / 2;
        this.drawBoxOutline(bx, by, bw, bh, lineMatGreen);
      }

      // Hitboxes (red)
      if (f.state === "attackActive" && f.moveId) {
        const move = char.moves[f.moveId];
        if (move) {
          for (const h of move.hitboxes) {
            const hw = h.w / 1000;
            const hh = h.h / 1000;
            const hx = f.x / 1000 + (f.facing === 1 ? h.x / 1000 + hw / 2 : -(h.x / 1000 + hw / 2));
            const hy = f.y / 1000 + h.y / 1000 + hh / 2;
            this.drawBoxOutline(hx, hy, hw, hh, lineMatRed);
          }
        }
      }
    }
  }

  private drawBoxOutline(
    cx: number,
    cy: number,
    w: number,
    h: number,
    material: THREE.LineBasicMaterial
  ): void {
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      new THREE.Vector3(cx - hw, cy - hh, 0.05),
      new THREE.Vector3(cx + hw, cy - hh, 0.05),
      new THREE.Vector3(cx + hw, cy + hh, 0.05),
      new THREE.Vector3(cx - hw, cy + hh, 0.05),
      new THREE.Vector3(cx - hw, cy - hh, 0.05),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, material);
    this.debugBoxGroup.add(line);
  }

  // --- Fallback Canvas Texture Generator ---

  private createFallbackStageTexture(stageId: string): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    if (stageId === "serverrum") {
      grad.addColorStop(0, "#030712");
      grad.addColorStop(1, "#0f172a");
    } else if (stageId === "fikarum") {
      grad.addColorStop(0, "#1c1917");
      grad.addColorStop(1, "#292524");
    } else if (stageId === "kontor") {
      grad.addColorStop(0, "#082f49");
      grad.addColorStop(1, "#0c4a6e");
    } else {
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(1, "#312e81");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  private onWindowResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy(): void {
    window.removeEventListener("resize", this.onWindowResize);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

interface FighterBodyParts {
  root: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  leftShin: THREE.Group;
  rightLeg: THREE.Group;
  rightShin: THREE.Group;
}
