import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import type { CharacterDef } from "@aipuf/contracts";
import {
  getHitboxes,
  getHurtboxes,
  getPushbox,
  type FighterRuntime,
  type MatchState,
  type ProjectileRuntime,
} from "@aipuf/sim";

export interface RendererOptions {
  container: HTMLDivElement;
  showBoxes?: boolean;
}

// 200 simulation subunits = 1.0 meter in 3D world (Street Fighter arcade scale)
export const WORLD_SCALE = 1 / 200;

/**
 * Authored idle/walk clips face -Z after the Root X-90 bind.
 * Camera sits at +Z, so yaw π turns them to look at the camera.
 * A small extra turn (~30°) aims the chest at the opponent without going into
 * profile — profile made the guard look like crossed arms.
 */
const AUTHORED_FACE_CAMERA = Math.PI;
const AUTHORED_THREE_QUARTER = 0.55;

interface LoadedFighterState {
  group: THREE.Group;
  gltfRoot: THREE.Group | null;
  proceduralParts: FighterBodyParts | null;
  mixer: THREE.AnimationMixer | null;
  actions: Record<string, THREE.AnimationAction>;
  currentAction: THREE.AnimationAction | null;
  currentState: string;
  isGltfLoaded: boolean;
  loadEpoch: number;
  archetype: string;
  primaryColor: string;
  secondaryColor: string;
  duckAmount: number;
  duckBones: {
    hip: THREE.Object3D;
    waist: THREE.Object3D | null;
    lThigh: THREE.Object3D | null;
    rThigh: THREE.Object3D | null;
    lCalf: THREE.Object3D | null;
    rCalf: THREE.Object3D | null;
    lFoot: THREE.Object3D | null;
    rFoot: THREE.Object3D | null;
    lUpper: THREE.Object3D | null;
    rUpper: THREE.Object3D | null;
    lFore: THREE.Object3D | null;
    rFore: THREE.Object3D | null;
  } | null;
  authoredScale: number;
}

function isAuthoredFighterModel(url?: string): boolean {
  if (!url) return false;
  return !/RobotExpressive|Soldier|Xbot|Michelle/.test(url);
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
  private shadowTexture: THREE.CanvasTexture;

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.showBoxes = options.showBoxes ?? false;
    this.shadowTexture = this.createShadowTexture();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.015);

    // Camera setup (Street Fighter 2.5D perspective)
    const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    this.camera.position.set(0, 1.4, 5.5);

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

    // Arena Floor Spotlight for dramatic tournament illumination
    const stageFloorSpot = new THREE.SpotLight(0xffffff, 2.8, 20, Math.PI / 3, 0.4, 1);
    stageFloorSpot.position.set(0, 9, 4);
    stageFloorSpot.target.position.set(0, 0, 0);
    this.scene.add(stageFloorSpot);
    this.scene.add(stageFloorSpot.target);

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
      loadEpoch: 0,
      archetype: "shoto-a",
      primaryColor: "#2563eb",
      secondaryColor: "#60a5fa",
      duckAmount: 0,
      duckBones: null,
      authoredScale: 1,
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
      loadEpoch: 0,
      archetype: "zoner-a",
      primaryColor: "#dc2626",
      secondaryColor: "#f87171",
      duckAmount: 0,
      duckBones: null,
      authoredScale: 1,
    };

    // Build procedural models immediately as zero-latency fallback
    this.fighter0.proceduralParts = this.buildProceduralFighter(
      this.fighter0.group,
      this.fighter0.primaryColor,
      this.fighter0.secondaryColor,
      this.fighter0.archetype,
      "grappler-a"
    );
    this.fighter1.proceduralParts = this.buildProceduralFighter(
      this.fighter1.group,
      this.fighter1.primaryColor,
      this.fighter1.secondaryColor,
      this.fighter1.archetype,
      "shoto-a"
    );

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

    // Rebuild procedural fighter with character colors and custom accessories
    if (this.fighter0.proceduralParts) {
      if (this.fighter0.proceduralParts.shadow) {
        this.scene.remove(this.fighter0.proceduralParts.shadow);
      }
      this.fighter0.group.remove(this.fighter0.proceduralParts.root);
    }
    this.fighter0.proceduralParts = this.buildProceduralFighter(
      this.fighter0.group,
      char0.colors[0],
      char0.colors[1],
      char0.archetype,
      char0.id
    );

    if (this.fighter1.proceduralParts) {
      if (this.fighter1.proceduralParts.shadow) {
        this.scene.remove(this.fighter1.proceduralParts.shadow);
      }
      this.fighter1.group.remove(this.fighter1.proceduralParts.root);
    }
    this.fighter1.proceduralParts = this.buildProceduralFighter(
      this.fighter1.group,
      char1.colors[0],
      char1.colors[1],
      char1.archetype,
      char1.id
    );

    this.fighter0.isGltfLoaded = false;
    this.fighter1.isGltfLoaded = false;
    this.fighter0.mixer = null;
    this.fighter1.mixer = null;
    if (this.fighter0.gltfRoot) {
      this.fighter0.group.remove(this.fighter0.gltfRoot);
      this.fighter0.gltfRoot = null;
    }
    if (this.fighter1.gltfRoot) {
      this.fighter1.group.remove(this.fighter1.gltfRoot);
      this.fighter1.gltfRoot = null;
    }

    if (isAuthoredFighterModel(char0.modelUrl)) {
      void this.loadRiggedFighter(0, char0.modelUrl!);
    }
    if (isAuthoredFighterModel(char1.modelUrl)) {
      void this.loadRiggedFighter(1, char1.modelUrl!);
    }
  }

  private async loadRiggedFighter(slot: 0 | 1, url: string): Promise<void> {
    const fighter = slot === 0 ? this.fighter0 : this.fighter1;
    const epoch = ++fighter.loadEpoch;

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

      if (epoch !== fighter.loadEpoch) return;

      const clonedScene = SkeletonUtils.clone(cached.scene) as THREE.Group;
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
            const hasMap = Boolean(mat.map);
            if (!hasMap) {
              const matName = (mat.name || "").toLowerCase();
              if (matName.includes("main") || matName.includes("highlimbs") || !matName) {
                mat.color = primaryCol;
                mat.emissive = primaryCol.clone().multiplyScalar(0.15);
              } else if (matName.includes("grey") || matName.includes("joints")) {
                mat.color = secondaryCol;
                mat.emissive = secondaryCol.clone().multiplyScalar(0.1);
              }
            }
            mat.roughness = hasMap ? 0.55 : 0.35;
            mat.metalness = hasMap ? 0.08 : 0.35;
            mat.side = THREE.FrontSide;
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Accurately normalize model height to 2.05m heroic arcade scale
      clonedScene.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(clonedScene);
      let size = box.getSize(new THREE.Vector3());

      // If bounding box calculation from setFromObject was degenerate
      if (size.y < 0.2 || size.y > 100) {
        box = new THREE.Box3();
        clonedScene.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            child.geometry.computeBoundingBox();
            if (child.geometry.boundingBox) {
              const meshBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
              box.union(meshBox);
            }
          }
        });
        size = box.getSize(new THREE.Vector3());
      }

      const desiredHeight = fighter.archetype.startsWith("hybrid") ? 1.92 : 2.0;
      const baseScale = desiredHeight / (size.y || 1);
      fighter.authoredScale = baseScale;
      clonedScene.scale.set(baseScale, baseScale, baseScale);
      clonedScene.rotation.y = 0;
      clonedScene.updateMatrixWorld(true);

      // Align bottom of feet firmly with stage floor (y = 0)
      const postBox = new THREE.Box3().setFromObject(clonedScene);
      clonedScene.position.y = -postBox.min.y;

      // Setup AnimationMixer
      const mixer = new THREE.AnimationMixer(clonedScene);
      const actions: Record<string, THREE.AnimationAction> = {};
      for (const clip of cached.animations) {
        const action = mixer.clipAction(clip);
        const key = clip.name.toLowerCase();
        actions[key] = action;
        const short = key.split("|").pop();
        if (short && !actions[short]) actions[short] = action;
        // KayKit exports sometimes arrive as idle_Armature_name
        const base = key.split("_armature")[0];
        if (base && !actions[base]) actions[base] = action;
      }

      if (fighter.gltfRoot) {
        fighter.group.remove(fighter.gltfRoot);
      }

      fighter.gltfRoot = clonedScene;
      fighter.mixer = mixer;
      fighter.actions = actions;
      fighter.currentAction = null;
      fighter.currentState = "";
      fighter.isGltfLoaded = true;
      fighter.duckAmount = 0;
      const bone = (name: string) => clonedScene.getObjectByName(name) ?? null;
      const hip = bone("Hip") ?? bone("Pelvis") ?? bone("hips");
      fighter.duckBones = hip
        ? {
            hip,
            waist: bone("Waist") ?? bone("Spine01"),
            lThigh: bone("L_Thigh") ?? bone("LeftUpLeg"),
            rThigh: bone("R_Thigh") ?? bone("RightUpLeg"),
            lCalf: bone("L_Calf") ?? bone("LeftLeg"),
            rCalf: bone("R_Calf") ?? bone("RightLeg"),
            lFoot: bone("L_Foot") ?? bone("LeftFoot") ?? bone("L_Toe"),
            rFoot: bone("R_Foot") ?? bone("RightFoot") ?? bone("R_Toe"),
            lUpper: bone("L_Upperarm") ?? bone("LeftArm"),
            rUpper: bone("R_Upperarm") ?? bone("RightArm"),
            lFore: bone("L_Forearm") ?? bone("LeftForeArm"),
            rFore: bone("R_Forearm") ?? bone("RightForeArm"),
          }
        : null;
      fighter.group.add(clonedScene);

      // Hide procedural parts once real 3D rigged model is ready
      if (fighter.proceduralParts) {
        fighter.proceduralParts.root.visible = false;
      }
    } catch {
      if (epoch !== fighter.loadEpoch) return;
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

    // High-Resolution Stage Floor with tournament markings and reflections
    const floorGeo = new THREE.PlaneGeometry(32, 14);
    const floorTex = this.createStageFloorTexture(stageId);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.3,
      metalness: 0.35,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 1.0);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Stage Backdrop Plane loading the cinematic AI image
    const backGeo = new THREE.PlaneGeometry(28, 14);
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
        this.bgMeshBack.position.set(0, 6.5, -5.5);
        this.scene.add(this.bgMeshBack);
      },
      undefined,
      () => {
        // Fallback procedural canvas texture if image not accessible
        const canvasTex = this.createFallbackStageTexture(stageId);
        const backMat = new THREE.MeshBasicMaterial({ map: canvasTex });
        if (this.bgMeshBack) this.scene.remove(this.bgMeshBack);
        this.bgMeshBack = new THREE.Mesh(backGeo, backMat);
        this.bgMeshBack.position.set(0, 6.5, -5.5);
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

    // Authoritative coordinate conversion: 200 simulation subunits = 1 meter
    const pos0X = f0.x * WORLD_SCALE;
    const pos0Y = f0.y * WORLD_SCALE;
    const pos1X = f1.x * WORLD_SCALE;
    const pos1Y = f1.y * WORLD_SCALE;

    this.fighter0.group.position.set(pos0X, pos0Y, 0);
    this.fighter0.group.scale.set(1, 1, 1);

    this.fighter1.group.position.set(pos1X, pos1Y, 0);
    this.fighter1.group.scale.set(1, 1, 1);

    this.orientFighter(this.fighter0, f0, pos0X, pos0Y);
    this.orientFighter(this.fighter1, f1, pos1X, pos1Y);

    // Hit-stop freeze frame check
    const isFrozen = this.hitFreezeFrames > 0;
    if (this.hitFreezeFrames > 0) {
      this.hitFreezeFrames--;
    }

    // Animate fighters
    this.updateFighterAnimation(this.fighter0, f0, isFrozen ? 0 : dt, state.chars[0]);
    this.updateFighterAnimation(this.fighter1, f1, isFrozen ? 0 : dt, state.chars[1]);

    // Camera follow midpoint with authentic Street Fighter framing
    const midX = (pos0X + pos1X) / 2;
    const dist = Math.abs(pos0X - pos1X);
    const peakY = Math.max(pos0Y, pos1Y);
    const targetCamX = Math.max(-3.4, Math.min(3.4, midX));
    const targetCamZ = Math.max(4.2, Math.min(7.2, 3.6 + dist * 0.52));
    const targetCamY = 1.4 + peakY * 0.72;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.16;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.16;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.18;

    // Apply Screen Shake
    if (this.screenShake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake;
      this.screenShake *= 0.85;
    } else {
      this.screenShake = 0;
    }

    this.camera.lookAt(this.camera.position.x, 1.2 + Math.max(pos0Y, pos1Y) * 0.5, 0);

    // Subtle parallax shift for background backdrop
    if (this.bgMeshBack) {
      this.bgMeshBack.position.x = this.camera.position.x * 0.16;
    }

    // Render projectiles with signature character styling
    this.renderProjectiles(state.projectiles, state.chars);

    // Subtle full-meter aura sparks
    if (f0.meter >= 1000 && Math.random() < 0.35) {
      this.spawnSparks(pos0X + (Math.random() - 0.5) * 0.8, pos0Y + 0.5, 0xf59e0b, 1, 0.08);
    }
    if (f1.meter >= 1000 && Math.random() < 0.35) {
      this.spawnSparks(pos1X + (Math.random() - 0.5) * 0.8, pos1Y + 0.5, 0xf43f5e, 1, 0.08);
    }

    // Process simulation events (hits, blocks, supers, knockouts)
    for (const ev of state.events) {
      if (ev.kind === "hit") {
        const victim = ev.source === 0 ? f1 : f0;
        const vx = victim.x * WORLD_SCALE;
        const vy = victim.y * WORLD_SCALE + 1.15;
        this.spawnSparks(vx, vy, 0xffbb00, 18, 0.14);
        this.spawnSparks(vx, vy, 0xff4400, 10, 0.09);
        this.screenShake = Math.max(this.screenShake, 0.12);
        this.triggerImpactFlash(0.25);
        this.hitFreezeFrames = 3; // 3-frame hit stop punch
      } else if (ev.kind === "block") {
        const blocker = ev.source === 0 ? f0 : f1;
        const bx = blocker.x * WORLD_SCALE;
        const by = blocker.y * WORLD_SCALE + 1.2;
        this.spawnSparks(bx, by, 0x38bdf8, 12, 0.1);
        this.spawnSparks(bx, by, 0xffffff, 6, 0.08);
        this.screenShake = Math.max(this.screenShake, 0.04);
      } else if (ev.kind === "super") {
        const user = ev.source === 0 ? f0 : f1;
        const char = ev.source === 0 || ev.source === 1 ? state.chars[ev.source] : null;
        const charId = char ? char.id : "shoto-a";
        const ux = user.x * WORLD_SCALE;
        const uy = user.y * WORLD_SCALE + 1.0;

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

  private updateFighterAnimation(
    fighter: LoadedFighterState,
    runtime: FighterRuntime,
    dt: number,
    char: CharacterDef
  ): void {
    if (fighter.isGltfLoaded && fighter.mixer) {
      this.playRiggedAnimation(fighter, runtime, char);
      fighter.mixer.update(dt);
      this.applyAuthoredDuck(fighter, runtime, char, dt);
    } else if (fighter.proceduralParts) {
      this.poseProceduralFighter(fighter.proceduralParts, runtime);
    }
  }

  private fighterYaw(fighter: LoadedFighterState, runtime: FighterRuntime): number {
    const authored = Boolean(fighter.gltfRoot && fighter.isGltfLoaded);
    if (authored) {
      if (runtime.state === "victory") return AUTHORED_FACE_CAMERA;
      return runtime.facing === 1
        ? -AUTHORED_FACE_CAMERA + AUTHORED_THREE_QUARTER
        : AUTHORED_FACE_CAMERA - AUTHORED_THREE_QUARTER;
    }
    if (runtime.state === "victory") return -Math.PI / 2;
    return runtime.facing === 1 ? -0.28 : Math.PI + 0.28;
  }

  private orientFighter(
    fighter: LoadedFighterState,
    runtime: FighterRuntime,
    posX: number,
    posY: number
  ): void {
    const yaw = this.fighterYaw(fighter, runtime);
    if (fighter.gltfRoot && fighter.isGltfLoaded) {
      const s = fighter.authoredScale || 1;
      fighter.gltfRoot.rotation.y = yaw;
      fighter.gltfRoot.scale.set(s, s, s);
    }
    if (fighter.proceduralParts) {
      fighter.proceduralParts.root.rotation.y = yaw;
      const shadow = fighter.proceduralParts.shadow;
      shadow.position.set(posX, 0.005, 0);
      const jump = Math.max(0, posY);
      const scale = Math.max(0.45, 1.0 - jump * 0.25);
      shadow.scale.set(scale, scale, 1);
      (shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.12, 0.6 - jump * 0.15);
    }
  }

  private playRiggedAnimation(
    fighter: LoadedFighterState,
    runtime: FighterRuntime,
    char: CharacterDef
  ): void {
    const state = runtime.state;
    const moveId = runtime.moveId;
    const isAttack =
      state === "attackStartup" || state === "attackActive" || state === "attackRecovery";
    const isAir = state === "jump" || state === "fall" || state === "jumpStartup";
    const stateKey = isAttack ? `attack:${moveId || ""}` : isAir ? "air" : `${state}:${moveId || ""}`;
    if (fighter.currentState === stateKey) return;
    fighter.currentState = stateKey;

    const findAction = (...names: string[]) => {
      for (const name of names) {
        const act = fighter.actions[name.toLowerCase()];
        if (act) return act;
      }
      return null;
    };

    const fitCycle = (action: THREE.AnimationAction | null, seconds: number) => {
      if (!action) return 1;
      return action.getClip().duration / Math.max(seconds, 0.08);
    };

    let targetAction: THREE.AnimationAction | null = null;
    let timeScale = 1.0;
    let loopOnce = false;
    let fade = 0.1;
    let startOffset = 0;

    switch (state) {
      case "idle":
        targetAction = findAction("idle", "standing");
        timeScale = fitCycle(targetAction, 1.85);
        break;
      case "walkForward": {
        targetAction = findAction("walk", "walking", "running");
        const mps = Math.max(0.45, Math.abs(runtime.vx) * WORLD_SCALE * 60);
        timeScale = fitCycle(targetAction, 1.25 / mps);
        fade = 0.12;
        break;
      }
      case "walkBackward": {
        // Always face the opponent: play the forward walk reversed (backstep), never turn-around clips.
        targetAction = findAction("walk", "walking", "running");
        const mps = Math.max(0.4, Math.abs(runtime.vx) * WORLD_SCALE * 60);
        timeScale = -fitCycle(targetAction, 1.2 / mps);
        fade = 0.12;
        break;
      }
      case "dash":
        targetAction = findAction("walk", "running", "run");
        timeScale = fitCycle(targetAction, 0.72);
        break;
      case "crouch":
      case "crouchBlock":
        // Authored "crouch" clips are sit/fish/crawl. Duck pose is applied after mixer.update.
        targetAction = findAction("idle", "standing");
        timeScale = fitCycle(targetAction, 1.6);
        break;
      case "jump":
      case "fall":
      case "jumpStartup":
        targetAction = findAction("jump", "walkjump");
        timeScale = fitCycle(targetAction, 0.55);
        loopOnce = true;
        fade = 0.05;
        break;
      case "standBlock":
      case "blockstun":
        targetAction = findAction("block", "idle");
        timeScale = fitCycle(targetAction, 1.4);
        break;
      case "throw":
        targetAction = findAction("special", "punch_heavy", "punch");
        loopOnce = true;
        fade = 0.04;
        break;
      case "thrown":
        targetAction = findAction("hit", "knockdown", "ko");
        loopOnce = true;
        fade = 0.04;
        break;
      case "wakeup":
      case "landing":
        targetAction = findAction("idle", "crouch");
        break;
      case "attackStartup":
      case "attackActive":
      case "attackRecovery": {
        const move = moveId || "";
        const isKick =
          move === "lk" ||
          move === "hk" ||
          move.includes("kick") ||
          move.includes("stomp") ||
          move.includes("sweep") ||
          move.includes("boot") ||
          move.includes("shin") ||
          move.includes("heel") ||
          move.includes("knee") ||
          move.includes("dive");
        const isSuper =
          move.includes("super") ||
          move.includes("overdrive") ||
          move.includes("biohazard") ||
          move.includes("speciale") ||
          move.includes("hulk") ||
          move.includes("vision") ||
          move.includes("velocity");
        const isSpecial =
          move.includes("hawaii") ||
          move.includes("blast") ||
          move.includes("roll") ||
          move.includes("laser") ||
          move.includes("entry") ||
          move.includes("grid") ||
          move.includes("silent") ||
          move.includes("cardiac") ||
          move.includes("fedora") ||
          move.includes("lasik") ||
          move.includes("firewall") ||
          move.includes("thunder") ||
          move.includes("uppercut") ||
          move.includes("lightning") ||
          move.includes("trap") ||
          move.includes("breaker");
        const isHeavy = move === "hp" || move === "hk" || move.includes("hammer") || move.includes("smash");

        if (isSuper) {
          targetAction = findAction("super", "special", "punch_heavy", "punch");
        } else if (isSpecial) {
          targetAction = findAction("special", "punch_heavy", "punch");
        } else if (isKick) {
          targetAction = findAction("kick", "punch");
        } else if (isHeavy) {
          targetAction = findAction("punch_heavy", "punch");
        } else {
          targetAction = findAction("punch", "kick");
        }
        loopOnce = true;
        fade = 0.04;
        const def = moveId ? char.moves[moveId] : undefined;
        const startup = Math.max(def?.startup ?? 5, 1);
        const totalSec = def ? (def.startup + def.active + def.recovery) / 60 : 0.35;
        const clipDur = targetAction?.getClip().duration ?? totalSec;
        const impactAt = Math.min(0.36, clipDur * 0.42);
        const windupAt = Math.max(0, impactAt - 0.11);
        timeScale = ((impactAt - windupAt) * 60) / startup;
        startOffset = windupAt;
        break;
      }
      case "hitstun":
        targetAction = findAction("hit", "no", "headshake");
        loopOnce = true;
        fade = 0.04;
        timeScale = fitCycle(targetAction, 0.28);
        break;
      case "knockdown":
        targetAction = findAction("knockdown", "ko", "death");
        loopOnce = true;
        break;
      case "ko":
        targetAction = findAction("ko", "knockdown", "death");
        loopOnce = true;
        break;
      case "victory":
        targetAction = findAction("victory", "idle");
        loopOnce = true;
        break;
      default:
        targetAction = findAction("idle");
    }

    if (targetAction && targetAction !== fighter.currentAction) {
      if (fighter.currentAction) {
        fighter.currentAction.fadeOut(fade);
      }
      targetAction.reset();
      targetAction.setEffectiveTimeScale(timeScale);
      targetAction.clampWhenFinished = loopOnce;
      targetAction.loop = loopOnce ? THREE.LoopOnce : THREE.LoopRepeat;
      if (startOffset > 0) targetAction.time = startOffset;
      targetAction.fadeIn(fade).play();
      fighter.currentAction = targetAction;
    } else if (targetAction) {
      targetAction.setEffectiveTimeScale(timeScale);
    }
  }

  /**
   * Authored idle/walk retarget wraps both hands across the chest.
   * Idle needs a modest uncross; walk/backwalk/dash swing one arm across harder
   * (retarget artifact), so locomotion uses a stronger + slightly skewed overlay.
   * Then apply duck squat. Runs after mixer.update.
   */
  private applyAuthoredDuck(
    fighter: LoadedFighterState,
    runtime: FighterRuntime,
    char: CharacterDef,
    dt: number
  ): void {
    const bones = fighter.duckBones;
    if (!bones) return;

    const attacking =
      runtime.state === "attackStartup" ||
      runtime.state === "attackActive" ||
      runtime.state === "attackRecovery";
    if (!attacking) {
      const walking =
        runtime.state === "walkForward" ||
        runtime.state === "walkBackward" ||
        runtime.state === "dash";
      if (walking) {
        // Stronger uncross than idle; R slightly more — walk clip crosses the
        // camera-side arm deeper across the chest on Irstababben / shared rig.
        bones.lUpper?.rotateX(-0.82);
        bones.rUpper?.rotateX(-0.95);
        bones.lFore?.rotateX(-0.52);
        bones.rFore?.rotateX(-0.62);
        // Nudge elbows outward so the swing stays off the torso silhouette.
        bones.lUpper?.rotateY(0.22);
        bones.rUpper?.rotateY(-0.28);
        bones.lFore?.rotateY(0.08);
        bones.rFore?.rotateY(-0.10);
      } else {
        bones.lUpper?.rotateX(-0.52);
        bones.rUpper?.rotateX(-0.52);
        bones.lFore?.rotateX(-0.35);
        bones.rFore?.rotateX(-0.35);
      }
    }

    const move = runtime.moveId ? char.moves[runtime.moveId] : undefined;
    const wantDuck =
      runtime.state === "crouch" ||
      runtime.state === "crouchBlock" ||
      Boolean(move?.lowPose && runtime.state.startsWith("attack"));

    const target = wantDuck ? 1 : 0;
    const k = 1 - Math.exp(-14 * Math.max(dt, 0));
    fighter.duckAmount += (target - fighter.duckAmount) * k;
    const d = fighter.duckAmount;
    if (d < 0.01) return;

    // Fighting knäböj on the Mixamo-style authored rig (Root X=-90, 3/4 yaw):
    // same-sign thigh rotateX sits the hips back (~0.57 lean). Opposite flex
    // signs scaled by facing keep the torso over the feet; abduct (Z) restores
    // knee spread so the squat is not knock-kneed. Never mesh-squash.
    // Hip.position.z is still Root-space height — plant feet with it only.
    const facing = runtime.facing === -1 ? -1 : 1;
    const flex = 0.5 * d;
    const abd = 0.35 * d;
    bones.lThigh?.rotateX(-flex * facing);
    bones.rThigh?.rotateX(flex * facing);
    bones.lThigh?.rotateZ(abd);
    bones.rThigh?.rotateZ(-abd);

    bones.hip.updateWorldMatrix(true, true);
    const s = fighter.authoredScale || 1;
    const world = new THREE.Vector3();
    let minY = Infinity;
    for (const foot of [bones.lFoot, bones.rFoot]) {
      if (!foot) continue;
      foot.getWorldPosition(world);
      if (world.y < minY) minY = world.y;
    }
    if (Number.isFinite(minY)) {
      bones.hip.position.z -= THREE.MathUtils.clamp(minY / s, -0.08, 0.14);
    }
  }

  // --- Dynamic Soft Contact Shadow Generator ---

  private createShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0.35)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // --- Bespoke Procedural 3D Fighter Rig ---

  private buildProceduralFighter(
    parent: THREE.Group,
    primaryColor: string,
    secondaryColor: string,
    archetype: string = "shoto-a",
    charId: string = "shoto-a"
  ): FighterBodyParts {
    const pMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.32,
      metalness: 0.25,
    });
    const sMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.40,
      metalness: 0.20,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5d0b0, // warm athletic skin tone
      roughness: 0.55,
      metalness: 0.05,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // dark navy / black for belts and soles
      roughness: 0.70,
      metalness: 0.20,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.95,
    });

    const root = new THREE.Group();

    // Archetype scale factor
    let rootScale = 1.22;
    if (charId === "grappler-a" || charId === "grappler-b") {
      rootScale = 1.32; // Heavyweight grappler build
    } else if (charId === "hybrid-a") {
      rootScale = 1.28; // Heavyweight powerlifter build
    } else if (archetype.startsWith("zoner")) {
      rootScale = 1.18; // Lean agile zoner
    }
    root.scale.set(rootScale, rootScale, rootScale);
    parent.add(root);

    // Anatomical dimension calibration:
    // +X is forward towards opponent (chest direction)
    // -X is backward (spine direction)
    // +Y is up
    // +Z is right/lead side (towards camera)
    // -Z is left/rear side (away from camera)
    let shoulderSpan = 0.25; // center to shoulder joint along Z
    let chestDepthX = 0.25;  // thickness from spine to pecs along X
    let torsoH = 0.52;

    if (charId === "grappler-a" || charId === "grappler-b") {
      shoulderSpan = 0.29; // massive broad shoulders
      chestDepthX = 0.29;
    } else if (charId === "hybrid-a") {
      shoulderSpan = 0.30; // barrel chest
      chestDepthX = 0.30;
    } else if (archetype.startsWith("zoner")) {
      shoulderSpan = 0.22; // lean athletic
      chestDepthX = 0.21;
    }

    // --- Torso Group (Center at y = 1.14) ---
    const torso = new THREE.Group();
    torso.position.set(0, 1.14, 0);
    root.add(torso);

    // 1. Upper Chest / Ribcage (V-taper)
    const chestGeo = new THREE.CylinderGeometry(
      shoulderSpan * 0.92,
      shoulderSpan * 0.76,
      torsoH * 0.58,
      12
    );
    const chestMesh = new THREE.Mesh(chestGeo, pMat);
    chestMesh.position.set(0, torsoH * 0.18, 0);
    chestMesh.scale.set((chestDepthX / shoulderSpan) * 1.05, 1, 1);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    torso.add(chestMesh);

    // Pectoral definition plates on front (+X)
    const pecGeo = new THREE.BoxGeometry(0.04, torsoH * 0.28, shoulderSpan * 0.72);
    const pecMesh = new THREE.Mesh(pecGeo, pMat);
    pecMesh.position.set(chestDepthX * 0.48, torsoH * 0.20, 0);
    pecMesh.castShadow = true;
    torso.add(pecMesh);

    // 2. Abdomen / Waist
    const abGeo = new THREE.CylinderGeometry(
      shoulderSpan * 0.74,
      shoulderSpan * 0.70,
      torsoH * 0.26,
      10
    );
    const abMesh = new THREE.Mesh(abGeo, sMat);
    abMesh.position.set(0, -torsoH * 0.16, 0);
    abMesh.scale.set((chestDepthX / shoulderSpan) * 0.95, 1, 1);
    abMesh.castShadow = true;
    torso.add(abMesh);

    // 3. Combat Belt around waist
    const beltGeo = new THREE.CylinderGeometry(
      shoulderSpan * 0.76,
      shoulderSpan * 0.76,
      0.08,
      12
    );
    const beltMesh = new THREE.Mesh(beltGeo, darkMat);
    beltMesh.position.set(0, -torsoH * 0.26, 0);
    beltMesh.scale.set((chestDepthX / shoulderSpan) * 1.0, 1, 1);
    torso.add(beltMesh);

    // Belt Buckle on front (+X)
    const buckleGeo = new THREE.BoxGeometry(0.04, 0.09, 0.12);
    const buckleMesh = new THREE.Mesh(buckleGeo, charId === "hybrid-a" ? chromeMat : goldMat);
    buckleMesh.position.set(chestDepthX * 0.48, -torsoH * 0.26, 0);
    torso.add(buckleMesh);

    // 4. Pelvis / Hips
    const pelvisGeo = new THREE.BoxGeometry(chestDepthX * 0.88, 0.14, shoulderSpan * 1.35);
    const pelvis = new THREE.Mesh(pelvisGeo, darkMat);
    pelvis.position.set(0, -torsoH * 0.38, 0);
    pelvis.castShadow = true;
    torso.add(pelvis);

    // 5. Neck
    const neckGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.12, 10);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, torsoH * 0.48, 0);
    neck.castShadow = true;
    torso.add(neck);

    // --- Head Group ---
    const head = new THREE.Group();
    head.position.set(0, torsoH * 0.52 + 0.14, 0);
    torso.add(head);

    // Cranium
    const headGeo = new THREE.SphereGeometry(0.14, 16, 14);
    const cranium = new THREE.Mesh(headGeo, skinMat);
    cranium.scale.set(1.0, 1.1, 0.95);
    cranium.castShadow = true;
    head.add(cranium);

    // Heroic Jaw / Chin Box
    const jawGeo = new THREE.BoxGeometry(0.12, 0.09, 0.12);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.position.set(0.05, -0.06, 0);
    jaw.castShadow = true;
    head.add(jaw);

    // Brow Ridge on front (+X)
    const browGeo = new THREE.BoxGeometry(0.05, 0.04, 0.18);
    const brow = new THREE.Mesh(browGeo, pMat);
    brow.position.set(0.11, 0.04, 0);
    head.add(brow);

    // Expressive Glowing Visor / Eyes
    const visorGeo = new THREE.BoxGeometry(0.04, 0.045, 0.16);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0.13, 0.005, 0);
    head.add(visor);

    // --- Shoulder Joints & Arms ---
    const shoulderY = torsoH * 0.34;

    const buildArm = (isRight: boolean) => {
      const armGroup = new THREE.Group();
      const zSign = isRight ? 1 : -1;
      armGroup.position.set(0, shoulderY, zSign * (shoulderSpan + 0.02));
      torso.add(armGroup);

      // Deltoid Shoulder Cap
      const deltGeo = new THREE.SphereGeometry(0.085, 12, 12);
      const deltoid = new THREE.Mesh(deltGeo, pMat);
      deltoid.scale.set(1.0, 1.1, 1.1);
      deltoid.castShadow = true;
      armGroup.add(deltoid);

      // Upper Arm (Biceps)
      const bicepGeo = new THREE.CylinderGeometry(0.058, 0.050, 0.26, 10);
      const upperArm = new THREE.Mesh(bicepGeo, skinMat);
      upperArm.position.set(0, -0.13, 0);
      upperArm.castShadow = true;
      armGroup.add(upperArm);

      // Elbow Joint
      const elbowGeo = new THREE.SphereGeometry(0.050, 8, 8);
      const elbow = new THREE.Mesh(elbowGeo, sMat);
      elbow.position.set(0, -0.26, 0);
      armGroup.add(elbow);

      // Forearm Group (Pivots at elbow)
      const forearmGroup = new THREE.Group();
      forearmGroup.position.set(0, -0.26, 0);
      armGroup.add(forearmGroup);

      // Forearm Musculature
      const forearmGeo = new THREE.CylinderGeometry(0.052, 0.044, 0.24, 10);
      const forearm = new THREE.Mesh(forearmGeo, sMat);
      forearm.position.set(0, -0.12, 0);
      forearm.castShadow = true;
      forearmGroup.add(forearm);

      // Wrist Cuff / Bracer
      const cuffGeo = new THREE.CylinderGeometry(0.054, 0.052, 0.06, 10);
      const cuff = new THREE.Mesh(cuffGeo, darkMat);
      cuff.position.set(0, -0.21, 0);
      forearmGroup.add(cuff);

      // Clenched Combat Fist at (0, -0.26, 0)
      const fistGroup = new THREE.Group();
      fistGroup.position.set(0, -0.26, 0);
      forearmGroup.add(fistGroup);

      const fistGeo = new THREE.BoxGeometry(0.08, 0.08, 0.07);
      const fist = new THREE.Mesh(fistGeo, skinMat);
      fist.position.set(0.01, -0.02, 0);
      fist.castShadow = true;
      fistGroup.add(fist);

      const thumbGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
      const thumb = new THREE.Mesh(thumbGeo, skinMat);
      thumb.position.set(0.05, -0.01, zSign * 0.02);
      fistGroup.add(thumb);

      return { armGroup, forearmGroup, fistGroup };
    };

    const rightArmParts = buildArm(true);
    const leftArmParts = buildArm(false);

    // --- Legs & Boots ---
    const legSpanZ = shoulderSpan * 0.52;

    const buildLeg = (isRight: boolean) => {
      const legGroup = new THREE.Group();
      const zSign = isRight ? 1 : -1;
      legGroup.position.set(0, -torsoH * 0.40, zSign * legSpanZ);
      torso.add(legGroup);

      // Hip Joint
      const hipGeo = new THREE.SphereGeometry(0.068, 10, 10);
      const hip = new THREE.Mesh(hipGeo, darkMat);
      legGroup.add(hip);

      // Thigh (Athletic Quad Taper)
      const thighGeo = new THREE.CylinderGeometry(0.078, 0.062, 0.36, 10);
      const thigh = new THREE.Mesh(thighGeo, pMat);
      thigh.position.set(0, -0.18, 0);
      thigh.castShadow = true;
      legGroup.add(thigh);

      // Knee Joint & Frontal Kneecap Plate
      const kneeGeo = new THREE.SphereGeometry(0.060, 8, 8);
      const knee = new THREE.Mesh(kneeGeo, sMat);
      knee.position.set(0, -0.36, 0);
      legGroup.add(knee);

      const kneecapGeo = new THREE.BoxGeometry(0.04, 0.08, 0.08);
      const kneecap = new THREE.Mesh(kneecapGeo, darkMat);
      kneecap.position.set(0.045, -0.36, 0);
      legGroup.add(kneecap);

      // Shin Group (Pivots at knee)
      const shinGroup = new THREE.Group();
      shinGroup.position.set(0, -0.36, 0);
      legGroup.add(shinGroup);

      // Shin / Calf
      const shinGeo = new THREE.CylinderGeometry(0.062, 0.054, 0.34, 10);
      const shin = new THREE.Mesh(shinGeo, sMat);
      shin.position.set(0, -0.17, 0);
      shin.castShadow = true;
      shinGroup.add(shin);

      // Boot Collar
      const bootCollarGeo = new THREE.CylinderGeometry(0.066, 0.060, 0.12, 10);
      const bootCollar = new THREE.Mesh(bootCollarGeo, darkMat);
      bootCollar.position.set(0, -0.27, 0);
      shinGroup.add(bootCollar);

      // --- Solid Grounded Boot at (0, -0.36, 0) ---
      const bootGroup = new THREE.Group();
      bootGroup.position.set(0, -0.36, 0);
      shinGroup.add(bootGroup);

      // Rubber Sole resting flush on floor
      const soleGeo = new THREE.BoxGeometry(0.24, 0.045, 0.12);
      const sole = new THREE.Mesh(soleGeo, darkMat);
      sole.position.set(0.04, 0.0225, 0);
      sole.castShadow = true;
      sole.receiveShadow = true;
      bootGroup.add(sole);

      // Raised Heel Pad behind ankle (-X)
      const heelGeo = new THREE.BoxGeometry(0.08, 0.025, 0.11);
      const heel = new THREE.Mesh(heelGeo, darkMat);
      heel.position.set(-0.06, 0.045, 0);
      bootGroup.add(heel);

      // Boot Upper (Leather body)
      const upperGeo = new THREE.BoxGeometry(0.18, 0.075, 0.11);
      const bootUpper = new THREE.Mesh(upperGeo, pMat);
      bootUpper.position.set(0.03, 0.06, 0);
      bootUpper.castShadow = true;
      bootGroup.add(bootUpper);

      // Reinforced Toe Cap pointing forward (+X)
      const toeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 8);
      const toe = new THREE.Mesh(toeGeo, darkMat);
      toe.rotation.x = Math.PI / 2;
      toe.position.set(0.13, 0.045, 0);
      bootGroup.add(toe);

      return { legGroup, shinGroup, bootGroup };
    };

    const rightLegParts = buildLeg(true);
    const leftLegParts = buildLeg(false);

    // Ground Contact Shadow pinned firmly to canvas floor
    const shadowGeo = new THREE.PlaneGeometry(1.2, 0.65);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      opacity: 0.60,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.005, 0);
    this.scene.add(shadow);

    const createJointState = (): JointState => ({
      rx: 0,
      ry: 0,
      rz: 0,
      targetRx: 0,
      targetRy: 0,
      targetRz: 0,
    });

    const parts: FighterBodyParts = {
      root,
      torso,
      head,
      leftArm: leftArmParts.armGroup,
      leftForearm: leftArmParts.forearmGroup,
      rightArm: rightArmParts.armGroup,
      rightForearm: rightArmParts.forearmGroup,
      leftLeg: leftLegParts.legGroup,
      leftShin: leftLegParts.shinGroup,
      rightLeg: rightLegParts.legGroup,
      rightShin: rightLegParts.shinGroup,
      shadow,
      charId,
      props: {},
      joints: {
        torso: createJointState(),
        head: createJointState(),
        leftArm: createJointState(),
        leftForearm: createJointState(),
        rightArm: createJointState(),
        rightForearm: createJointState(),
        leftLeg: createJointState(),
        leftShin: createJointState(),
        rightLeg: createJointState(),
        rightShin: createJointState(),
      },
      rootY: { current: 0, target: 0 },
      baseRootY: 0,
    };

    // Attach signature props and character accessories
    this.addCharacterAccessories(parts, charId, primaryColor, secondaryColor);

    // Ground Alignment: compute bottom-most extent of the boots and ground firmly at y = 0
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const baseRootY = -bounds.min.y;
    root.position.y = baseRootY;
    parts.baseRootY = baseRootY;

    return parts;
  }

  // --- Character Accessories & Signature Props Builder ---

  private addCharacterAccessories(
    parts: FighterBodyParts,
    charId: string,
    primaryColor: string,
    secondaryColor: string
  ): void {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.2,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.3,
    });

    if (charId === "grappler-a") {
      // --- Capitan: Navy Fedora Hat, Pauldrons, Brass Knuckles & Eagle Belt ---
      const hatMat = new THREE.MeshStandardMaterial({
        color: 0x172554,
        roughness: 0.5,
        metalness: 0.1,
      });

      // Fedora Brim tilted forward toward +X
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 20), hatMat);
      brim.position.set(0.02, 0.14, 0);
      brim.rotation.z = -0.08;
      parts.head.add(brim);

      // Fedora Crown
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.13, 20), hatMat);
      crown.position.set(0.02, 0.21, 0);
      crown.rotation.z = -0.08;
      parts.head.add(crown);

      // Fedora Gold Ribbon
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.03, 20), goldMat);
      ribbon.position.set(0.02, 0.16, 0);
      ribbon.rotation.z = -0.08;
      parts.head.add(ribbon);

      // Pauldrons (Shoulder Armor)
      const lPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), hatMat);
      lPad.position.set(0, 0.04, 0);
      parts.leftArm.add(lPad);

      const rPad = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.13, 0.20), hatMat);
      rPad.position.set(0, 0.04, 0);
      parts.rightArm.add(rPad);

      // Brass Knuckles positioned right on the clenched fists
      const rKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.08), goldMat);
      rKnuckle.position.set(0.04, -0.26, 0);
      parts.rightForearm.add(rKnuckle);

      const lKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.08), goldMat);
      lKnuckle.position.set(0.04, -0.26, 0);
      parts.leftForearm.add(lKnuckle);

      // Eagle Championship Belt Buckle on front (+X)
      const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.14), goldMat);
      beltBuckle.position.set(0.22, -0.22, 0);
      parts.torso.add(beltBuckle);
    } else if (charId === "shoto-a") {
      // --- Irstababben: Swedish Chef Toque, Red Apron & 3D Wooden Pizza Spade (Pizzaspade) ---
      const whiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
      });
      const redMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.4,
      });
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.65,
        metalness: 0.05,
      });
      const woodMatDark = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.5,
        metalness: 0.08,
      });

      // Chef's Toque (White Hat with Red Base Band)
      const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.05, 16), redMat);
      hatBand.position.set(0, 0.15, 0);
      parts.head.add(hatBand);

      const toqueCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.15, 0.28, 16), whiteMat);
      toqueCrown.position.set(0, 0.30, 0);
      parts.head.add(toqueCrown);

      // Chef Waist Apron on front (+X)
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.28), redMat);
      apron.position.set(0.18, -0.24, 0);
      parts.torso.add(apron);

      // 3D Wooden Pizza Spade (Pizzaspade) gripped directly in right fist at (0, -0.26, 0)
      const spadeGroup = new THREE.Group();

      // Turned birch handle with agile fighting proportions (0.54m)
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.54, 8), woodMat);
      handle.position.set(0.14, 0, 0);
      handle.rotation.z = Math.PI / 2;
      handle.castShadow = true;
      spadeGroup.add(handle);

      // Handle grip wrap at hand
      const gripWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), redMat);
      gripWrap.position.set(0, 0, 0);
      gripWrap.rotation.z = Math.PI / 2;
      spadeGroup.add(gripWrap);

      // Pommel ring at rear
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), goldMat);
      pommel.position.set(-0.14, 0, 0);
      spadeGroup.add(pommel);

      // Flared Birch Paddle Blade
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.022, 0.20), woodMatDark);
      blade.position.set(0.44, 0, 0);
      blade.castShadow = true;
      spadeGroup.add(blade);

      // Beveled Gold Crust Edge
      const bevel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.024, 0.18), goldMat);
      bevel.position.set(0.57, 0, 0);
      spadeGroup.add(bevel);

      // Attach spadeGroup to right fist pivot
      spadeGroup.position.set(0, -0.26, 0);
      spadeGroup.rotation.set(0.12, 0, 0.25);
      parts.rightForearm.add(spadeGroup);
      parts.props["spade"] = spadeGroup;
      parts.props["spadeBlade"] = blade;
    } else if (charId === "zoner-a") {
      // --- Femboyfippe: Cyber Visor, Defibrillator Electrode Forearm Pads & ECG Diode ---
      const cyanNeonMat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      const violetNeonMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 1.6,
        roughness: 0.2,
      });

      // Cyber Visor
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.22), cyanNeonMat);
      visor.position.set(0.13, 0.02, 0);
      parts.head.add(visor);

      // Defibrillator Shock Paddles on Forearms
      const rPaddle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.08), cyanNeonMat);
      rPaddle.position.set(0.04, -0.16, 0);
      parts.rightForearm.add(rPaddle);

      const lPaddle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.08), violetNeonMat);
      lPaddle.position.set(0.04, -0.16, 0);
      parts.leftForearm.add(lPaddle);

      // Chest ECG Heart Diode on front (+X)
      const ecg = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), cyanNeonMat);
      ecg.position.set(0.16, 0.08, 0);
      parts.torso.add(ecg);
    } else if (charId === "grappler-b") {
      // --- Babas: Dark Sunglasses & Twin Shoulder LASIK Laser Cannons ---
      const sunglassesMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        metalness: 0.9,
        roughness: 0.1,
      });
      const rubyLaserMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });

      // Sunglasses
      const shades = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), sunglassesMat);
      shades.position.set(0.13, 0.03, 0);
      parts.head.add(shades);

      // Right Shoulder LASIK Cannon pointing forward (+X)
      const cannonR = new THREE.Group();
      const baseR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), darkMat);
      const barrelR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.18, 8), steelMat);
      barrelR.position.set(0.08, 0, 0);
      barrelR.rotation.z = -Math.PI / 2;
      const lensR = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), rubyLaserMat);
      lensR.position.set(0.17, 0, 0);
      cannonR.add(baseR, barrelR, lensR);
      cannonR.position.set(0, 0.08, 0);
      parts.rightArm.add(cannonR);

      // Left Shoulder LASIK Cannon pointing forward (+X)
      const cannonL = new THREE.Group();
      const baseL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), darkMat);
      const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.18, 8), steelMat);
      barrelL.position.set(0.08, 0, 0);
      barrelL.rotation.z = -Math.PI / 2;
      const lensL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), rubyLaserMat);
      lensL.position.set(0.17, 0, 0);
      cannonL.add(baseL, barrelL, lensL);
      cannonL.position.set(0, 0.08, 0);
      parts.leftArm.add(cannonL);

      // Combat Wraps
      const wrapMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.6 });
      const rWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.10, 8), wrapMat);
      rWrap.position.set(0, -0.18, 0);
      parts.rightForearm.add(rWrap);
    } else if (charId === "zoner-b") {
      // --- Stinkfiend: Gas Mask with Filter Canisters & Twin Back Biohazard Sludge Tanks ---
      const toxicGreenMat = new THREE.MeshStandardMaterial({
        color: 0x84cc16,
        emissive: 0x4ade80,
        emissiveIntensity: 1.6,
        roughness: 0.3,
      });
      const tankMat = new THREE.MeshStandardMaterial({
        color: 0x15803d,
        metalness: 0.6,
        roughness: 0.35,
      });

      // Gas Mask Snout on front (+X)
      const maskSnout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.14), darkMat);
      maskSnout.position.set(0.12, -0.04, 0);
      parts.head.add(maskSnout);

      // Cheek Filter Canisters
      const canR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 8), darkMat);
      canR.position.set(0.06, -0.06, 0.11);
      parts.head.add(canR);

      const canL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 8), darkMat);
      canL.position.set(0.06, -0.06, -0.11);
      parts.head.add(canL);

      // Glowing Toxic Lenses on front (+X)
      const lensR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), toxicGreenMat);
      lensR.position.set(0.12, 0.04, 0.06);
      parts.head.add(lensR);

      const lensL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), toxicGreenMat);
      lensL.position.set(0.12, 0.04, -0.06);
      parts.head.add(lensL);

      // Twin Back Biohazard Tanks on rear (-X)
      const tankR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.44, 10), tankMat);
      tankR.position.set(-0.16, 0.05, 0.11);
      parts.torso.add(tankR);

      const tankL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.44, 10), tankMat);
      tankL.position.set(-0.16, 0.05, -0.11);
      parts.torso.add(tankL);

      // Toxic Sludge Indicator Sight Glass on rear
      const sightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), toxicGreenMat);
      sightTube.position.set(-0.21, 0.05, 0);
      parts.torso.add(sightTube);
    } else if (charId === "hybrid-a") {
      // --- Ekander: Heavyweight Powerlifting Belt, Chrome Buckle & Gold Brow Guard ---
      const beltLeatherMat = new THREE.MeshStandardMaterial({
        color: 0x3b0764,
        roughness: 0.7,
        metalness: 0.1,
      });

      // Heavy Powerlifting Belt
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), beltLeatherMat);
      belt.position.set(0, -0.22, 0);
      parts.torso.add(belt);

      // Giant Chrome Steel Buckle on front (+X)
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.14), steelMat);
      buckle.position.set(0.22, -0.22, 0);
      parts.torso.add(buckle);

      // Gold Brow Guard
      const brow = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.04, 16), goldMat);
      brow.position.set(0, 0.08, 0);
      parts.head.add(brow);
    } else if (charId === "shoto-b") {
      // --- Goonström: Shadow Assassin Cowl / Hood & Magenta Glowing Visor ---
      const magentaNeonMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xd946ef,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });

      // Deep Assassin Shadow Hood
      const hood = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.8),
        darkMat
      );
      hood.position.set(0, 0.04, 0);
      parts.head.add(hood);

      // Piercing Glowing Eye Slit within Hood on front (+X)
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.18), magentaNeonMat);
      visor.position.set(0.13, 0.02, 0);
      parts.head.add(visor);

      // Spiked Forearm Wraps
      const gauntletR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.11), darkMat);
      gauntletR.position.set(0, -0.13, 0);
      parts.rightForearm.add(gauntletR);

      const gauntletL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.11), darkMat);
      gauntletL.position.set(0, -0.13, 0);
      parts.leftForearm.add(gauntletL);
    } else {
      // --- Bulgarian Copper Thief: Worker Flat Cap, Steampunk Goggles, Copper Wire Coils & Crowbar ---
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.7,
        metalness: 0.1,
      });
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.85,
        roughness: 0.25,
      });
      const copperMat = new THREE.MeshStandardMaterial({
        color: 0xcd7f32,
        metalness: 0.92,
        roughness: 0.2,
      });

      // Worker Newsboy Flat Cap
      const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.17, 0.07, 16), capMat);
      capCrown.position.set(0.02, 0.16, 0);
      capCrown.rotation.z = -0.08;
      parts.head.add(capCrown);

      const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.14), capMat);
      capBrim.position.set(0.12, 0.14, 0);
      parts.head.add(capBrim);

      // Steampunk Brass Goggles on forehead (+X)
      const goggleR = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 16), brassMat);
      goggleR.position.set(0.12, 0.10, 0.05);
      parts.head.add(goggleR);

      const goggleL = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 16), brassMat);
      goggleL.position.set(0.12, 0.10, -0.05);
      parts.head.add(goggleL);

      // Coiled Stripped Copper Wires on Forearms
      for (let i = 0; i < 3; i++) {
        const cRingR = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.011, 8, 16), copperMat);
        cRingR.position.set(0, -0.08 - i * 0.06, 0);
        cRingR.rotation.x = Math.PI / 2;
        parts.rightForearm.add(cRingR);

        const cRingL = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.011, 8, 16), copperMat);
        cRingL.position.set(0, -0.08 - i * 0.06, 0);
        cRingL.rotation.x = Math.PI / 2;
        parts.leftForearm.add(cRingL);
      }

      // Steel Crowbar holstered on hip
      const crowbar = new THREE.Group();
      const cbShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.44, 8), steelMat);
      const cbHook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.016, 6, 12, Math.PI * 0.8), steelMat);
      cbHook.position.set(0, 0.22, 0);
      cbHook.rotation.z = Math.PI / 4;
      crowbar.add(cbShaft, cbHook);
      crowbar.position.set(-0.05, -0.22, 0.16);
      crowbar.rotation.z = -0.3;
      parts.torso.add(crowbar);
    }
  }

  // --- High-Fidelity Procedural Combat Pose & Joint Lerp Engine ---

  private poseProceduralFighter(parts: FighterBodyParts, fighter: FighterRuntime): void {
    const t = fighter.stateTime * 0.15;

    // Reset joint targets to neutral
    const j = parts.joints;
    j.torso.targetRx = 0; j.torso.targetRy = 0; j.torso.targetRz = 0;
    j.head.targetRx = 0; j.head.targetRy = 0; j.head.targetRz = 0;
    j.leftArm.targetRx = 0; j.leftArm.targetRy = 0; j.leftArm.targetRz = 0;
    j.leftForearm.targetRx = 0; j.leftForearm.targetRy = 0; j.leftForearm.targetRz = 0;
    j.rightArm.targetRx = 0; j.rightArm.targetRy = 0; j.rightArm.targetRz = 0;
    j.rightForearm.targetRx = 0; j.rightForearm.targetRy = 0; j.rightForearm.targetRz = 0;
    j.leftLeg.targetRx = 0; j.leftLeg.targetRy = 0; j.leftLeg.targetRz = 0;
    j.leftShin.targetRx = 0; j.leftShin.targetRy = 0; j.leftShin.targetRz = 0;
    j.rightLeg.targetRx = 0; j.rightLeg.targetRy = 0; j.rightLeg.targetRz = 0;
    j.rightShin.targetRx = 0; j.rightShin.targetRy = 0; j.rightShin.targetRz = 0;
    parts.rootY.target = 0;

    let lerpSpeed = 0.28;

    switch (fighter.state) {
      case "idle": {
        const breath = Math.sin(t * 3.2) * 0.035;
        const sway = Math.cos(t * 1.8) * 0.02;

        // Subtle 3/4 arcade perspective twist towards camera
        j.torso.targetRy = 0.16 + sway * 0.3;
        j.torso.targetRz = breath * 0.4;
        j.head.targetRy = -0.10;
        j.head.targetRz = -breath * 0.2;

        // Lower hips slightly into authentic fighting stance
        parts.rootY.target = -0.05 + breath * 0.02;

        // Front lead arm (right) in high fighting guard
        j.rightArm.targetRz = 0.55 + breath;
        j.rightForearm.targetRz = -0.92 + breath * 0.4;
        j.rightArm.targetRy = -0.12;

        // Rear arm (left) protecting chin
        j.leftArm.targetRz = 0.40 + breath * 0.8;
        j.leftForearm.targetRz = -0.80 + breath * 0.3;
        j.leftArm.targetRy = 0.10;

        // Grounded fighting stance with natural knee flex
        j.rightLeg.targetRz = 0.22;
        j.rightShin.targetRz = -0.28;
        j.leftLeg.targetRz = -0.18;
        j.leftShin.targetRz = 0.22;
        lerpSpeed = 0.25;
        break;
      }
      case "walkForward": {
        const walkPhase = fighter.stateTime * 0.42;
        const legCycle = Math.sin(walkPhase) * 0.55;
        const kneeBend = Math.max(0, Math.sin(walkPhase + 0.8)) * 0.60;

        j.rightLeg.targetRz = legCycle;
        j.rightShin.targetRz = -kneeBend;
        j.leftLeg.targetRz = -legCycle;
        j.leftShin.targetRz = -Math.max(0, -Math.sin(walkPhase + 0.8)) * 0.60;

        j.rightArm.targetRz = -legCycle * 0.45 + 0.35;
        j.leftArm.targetRz = legCycle * 0.45 + 0.30;
        j.torso.targetRz = 0.12;
        j.torso.targetRy = 0.14;
        parts.rootY.target = -0.04 + Math.abs(Math.sin(walkPhase)) * 0.035;
        lerpSpeed = 0.35;
        break;
      }
      case "walkBackward": {
        const walkPhase = fighter.stateTime * 0.36;
        const legCycle = Math.sin(walkPhase) * 0.45;

        j.rightLeg.targetRz = -legCycle;
        j.leftLeg.targetRz = legCycle;

        // High defensive guard while retreating
        j.rightArm.targetRz = 0.75;
        j.rightForearm.targetRz = -1.15;
        j.leftArm.targetRz = 0.65;
        j.leftForearm.targetRz = -1.05;
        j.torso.targetRz = -0.08;
        j.torso.targetRy = 0.12;
        parts.rootY.target = -0.04;
        lerpSpeed = 0.32;
        break;
      }
      case "jumpStartup": {
        parts.rootY.target = -0.16;
        j.torso.targetRz = 0.22;
        j.rightLeg.targetRz = 0.52;
        j.leftLeg.targetRz = 0.52;
        j.rightShin.targetRz = -0.75;
        j.leftShin.targetRz = -0.75;
        lerpSpeed = 0.55;
        break;
      }
      case "landing": {
        parts.rootY.target = -0.14;
        j.torso.targetRz = 0.16;
        j.rightLeg.targetRz = 0.45;
        j.leftLeg.targetRz = 0.45;
        j.rightShin.targetRz = -0.65;
        j.leftShin.targetRz = -0.65;
        lerpSpeed = 0.50;
        break;
      }
      case "crouch":
      case "crouchBlock": {
        parts.rootY.target = -0.38;
        j.torso.targetRz = 0.32;
        j.rightLeg.targetRz = 0.95;
        j.rightShin.targetRz = -1.45;
        j.leftLeg.targetRz = 0.95;
        j.leftShin.targetRz = -1.45;

        if (fighter.state === "crouchBlock") {
          j.rightArm.targetRz = 0.95;
          j.rightForearm.targetRz = -1.55;
          j.leftArm.targetRz = 0.85;
          j.leftForearm.targetRz = -1.45;
        } else {
          j.rightArm.targetRz = 0.70;
          j.rightForearm.targetRz = -1.25;
          j.leftArm.targetRz = 0.55;
          j.leftForearm.targetRz = -1.15;
        }
        lerpSpeed = 0.40;
        break;
      }
      case "jump":
      case "fall": {
        j.torso.targetRz = 0.15;
        j.rightLeg.targetRz = 0.65;
        j.rightShin.targetRz = -0.85;
        j.leftLeg.targetRz = -0.35;
        j.leftShin.targetRz = -0.45;
        j.rightArm.targetRz = -0.75;
        j.leftArm.targetRz = -0.55;
        lerpSpeed = 0.35;
        break;
      }
      case "standBlock":
      case "blockstun": {
        j.torso.targetRz = -0.16;
        j.rightArm.targetRz = 1.25;
        j.rightForearm.targetRz = -1.65;
        j.leftArm.targetRz = 1.15;
        j.leftForearm.targetRz = -1.55;
        j.rightLeg.targetRz = 0.22;
        j.leftLeg.targetRz = -0.22;
        lerpSpeed = 0.45;
        break;
      }
      case "thrown":
      case "hitstun": {
        // High impact flinch backwards
        j.torso.targetRz = -0.55;
        j.torso.targetRy = -0.20;
        j.head.targetRz = -0.40;
        j.rightArm.targetRz = -0.85;
        j.rightForearm.targetRz = -0.35;
        j.leftArm.targetRz = -0.65;
        j.leftForearm.targetRz = -0.45;
        j.rightLeg.targetRz = 0.40;
        j.leftLeg.targetRz = -0.35;
        lerpSpeed = 0.65; // Snappy recoil
        break;
      }
      case "wakeup": {
        parts.rootY.target = -0.35;
        j.torso.targetRz = -0.35;
        j.rightArm.targetRz = 0.6;
        j.leftArm.targetRz = 0.6;
        j.rightLeg.targetRz = 0.4;
        j.leftLeg.targetRz = 0.4;
        lerpSpeed = 0.35;
        break;
      }
      case "throw": {
        j.torso.targetRz = 0.42;
        j.rightArm.targetRz = 1.45;
        j.rightForearm.targetRz = 0.35;
        j.rightArm.targetRy = 0.3;
        j.leftArm.targetRz = 1.35;
        j.leftForearm.targetRz = 0.35;
        j.leftArm.targetRy = -0.3;
        j.rightLeg.targetRz = 0.45;
        j.leftLeg.targetRz = -0.45;
        lerpSpeed = 0.60;
        break;
      }
      case "knockdown": {
        // Fall flat onto back on the canvas floor
        parts.rootY.target = -0.92;
        j.torso.targetRz = -Math.PI * 0.47;
        j.head.targetRz = 0.22;
        j.rightArm.targetRz = -0.45;
        j.leftArm.targetRz = -0.45;
        j.rightLeg.targetRz = -0.15;
        j.leftLeg.targetRz = -0.25;
        lerpSpeed = 0.65;
        break;
      }
      case "ko": {
        // Lying knocked out flat on back
        parts.rootY.target = -0.94;
        j.torso.targetRz = -Math.PI * 0.48;
        j.head.targetRz = 0.20;
        j.rightArm.targetRz = -0.50;
        j.leftArm.targetRz = -0.45;
        j.rightLeg.targetRz = -0.15;
        j.leftLeg.targetRz = -0.25;
        lerpSpeed = 0.40;
        break;
      }
      case "victory": {
        // Winner faces player/camera triumphantly!
        parts.rootY.target = 0.0;
        j.torso.targetRy = 0.65;
        j.head.targetRy = -0.30;
        j.rightArm.targetRz = 2.65;
        j.rightForearm.targetRz = 0.12;
        j.leftArm.targetRz = 0.35;
        j.leftForearm.targetRz = -0.65;
        j.rightLeg.targetRz = 0.20;
        j.leftLeg.targetRz = -0.20;
        lerpSpeed = 0.25;
        break;
      }
      case "attackStartup": {
        const move = fighter.moveId || "";
        const isKick = move === "lk" || move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot");
        const isHeavy = move === "hp" || move === "hk" || move.includes("hammer") || move.includes("super") || move.includes("spade");

        if (isKick) {
          j.torso.targetRz = -0.25;
          j.rightLeg.targetRz = -0.45;
          j.rightShin.targetRz = -0.85;
          j.rightArm.targetRz = 0.5;
          j.leftArm.targetRz = 0.4;
        } else {
          j.torso.targetRz = isHeavy ? -0.45 : -0.22;
          j.rightArm.targetRz = isHeavy ? -0.95 : -0.65;
          j.rightForearm.targetRz = -0.95;
        }
        lerpSpeed = 0.45;
        break;
      }
      case "attackActive": {
        const move = fighter.moveId || "";
        const isKickA = move === "lk";
        const isKickB = move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot");
        const isPunchA = move === "lp";
        const isPunchB = move === "hp" || move.includes("hammer") || move.includes("smash") || move.includes("spade") || move.includes("haymaker");
        const isThrow = move === "throw" || move.includes("grab") || move.includes("suplex");
        const isSuper = move.includes("super") || move.includes("overdrive") || move.includes("biohazard") || move.includes("velocity") || move.includes("grid");

        if (fighter.airborne) {
          j.torso.targetRz = 0.38;
          j.rightLeg.targetRz = 1.35;
          j.rightShin.targetRz = 0.2;
          j.leftLeg.targetRz = -0.7;
          j.leftShin.targetRz = -0.9;
          j.rightArm.targetRz = 1.25;
          j.leftArm.targetRz = -0.55;
        } else if (isThrow) {
          // Grapple clamp
          j.torso.targetRz = 0.42;
          j.rightArm.targetRz = 1.45;
          j.rightForearm.targetRz = 0.35;
          j.rightArm.targetRy = 0.3;
          j.leftArm.targetRz = 1.35;
          j.leftForearm.targetRz = 0.35;
          j.leftArm.targetRy = -0.3;
          j.rightLeg.targetRz = 0.45;
          j.leftLeg.targetRz = -0.45;
        } else if (isSuper) {
          // Explosive super surge
          j.torso.targetRz = 0.45;
          j.head.targetRz = -0.25;
          j.rightArm.targetRz = 1.72;
          j.rightForearm.targetRz = 0.12;
          j.leftArm.targetRz = -0.85;
          j.leftForearm.targetRz = -0.65;
          j.rightLeg.targetRz = 0.65;
          j.leftLeg.targetRz = -0.75;
        } else if (isKickB) {
          // High roundhouse / axe kick
          j.torso.targetRz = -0.28;
          j.rightLeg.targetRz = 1.82;
          j.rightShin.targetRz = 0.2;
          j.leftLeg.targetRz = -0.42;
          j.leftShin.targetRz = -0.65;
          j.rightArm.targetRz = -0.45;
          j.leftArm.targetRz = 0.85;
        } else if (isKickA) {
          // Low/mid snap poke
          j.torso.targetRz = -0.14;
          j.rightLeg.targetRz = 1.22;
          j.rightShin.targetRz = 0.12;
          j.leftLeg.targetRz = -0.32;
          j.leftShin.targetRz = -0.32;
          j.rightArm.targetRz = 0.65;
          j.leftArm.targetRz = 0.72;
        } else if (isPunchB) {
          // Overhead heavy smash / hammer / pizza spade strike
          j.torso.targetRz = 0.60;
          j.rightArm.targetRz = 1.76;
          j.rightForearm.targetRz = -0.18;
          j.leftArm.targetRz = -0.65;
          j.leftForearm.targetRz = -0.52;
          j.rightLeg.targetRz = 0.65;
          j.leftLeg.targetRz = -0.65;
        } else {
          // Clean straight jab
          j.torso.targetRz = 0.24;
          j.rightArm.targetRz = 1.52;
          j.rightForearm.targetRz = 0.06;
          j.leftArm.targetRz = 0.72;
          j.leftForearm.targetRz = -1.22;
          j.rightLeg.targetRz = 0.38;
          j.leftLeg.targetRz = -0.38;
        }
        lerpSpeed = 0.70; // Snappy strike impact!
        break;
      }
      case "attackRecovery": {
        const move = fighter.moveId || "";
        const isKick = move === "lk" || move === "hk" || move.includes("kick") || move.includes("stomp") || move.includes("sweep") || move.includes("boot");
        if (isKick) {
          j.torso.targetRz = -0.06;
          j.rightLeg.targetRz = 0.45;
          j.rightShin.targetRz = -0.42;
          j.leftLeg.targetRz = -0.2;
        } else {
          j.torso.targetRz = 0.12;
          j.rightArm.targetRz = 0.78;
          j.rightForearm.targetRz = -0.65;
        }
        lerpSpeed = 0.32;
        break;
      }
    }

    // Smooth Euler angle interpolation
    const applyJoint = (mesh: THREE.Object3D, joint: JointState) => {
      joint.rx += (joint.targetRx - joint.rx) * lerpSpeed;
      joint.ry += (joint.targetRy - joint.ry) * lerpSpeed;
      joint.rz += (joint.targetRz - joint.rz) * lerpSpeed;
      mesh.rotation.set(joint.rx, joint.ry, joint.rz);
    };

    applyJoint(parts.torso, j.torso);
    applyJoint(parts.head, j.head);
    applyJoint(parts.leftArm, j.leftArm);
    applyJoint(parts.leftForearm, j.leftForearm);
    applyJoint(parts.rightArm, j.rightArm);
    applyJoint(parts.rightForearm, j.rightForearm);
    applyJoint(parts.leftLeg, j.leftLeg);
    applyJoint(parts.leftShin, j.leftShin);
    applyJoint(parts.rightLeg, j.rightLeg);
    applyJoint(parts.rightShin, j.rightShin);

    parts.rootY.current += (parts.rootY.target - parts.rootY.current) * lerpSpeed;
    parts.root.position.y = parts.baseRootY + parts.rootY.current;

    // Signature Weapon Dynamics
    if (parts.props["spade"]) {
      const spade = parts.props["spade"];
      const bladeMat = parts.props["spadeBlade"]
        ? ((parts.props["spadeBlade"] as THREE.Mesh).material as THREE.MeshStandardMaterial)
        : null;

      if (fighter.state === "attackActive") {
        if (fighter.moveId?.includes("super")) {
          // Blazing Pizza Oven Super Slash
          spade.rotation.set(0.3, 0, 1.15);
          if (bladeMat) {
            bladeMat.emissive = new THREE.Color(0xf97316);
            bladeMat.emissiveIntensity = 3.0;
          }
        } else {
          // Powerful downward spade swing
          spade.rotation.set(0.18, 0, 0.92);
          if (bladeMat) bladeMat.emissiveIntensity = 0.0;
        }
      } else if (fighter.state === "attackStartup") {
        // Cocked back behind shoulder
        spade.rotation.set(-0.25, 0, -0.70);
        if (bladeMat) bladeMat.emissiveIntensity = 0.0;
      } else {
        // Natural combat ready grip
        spade.rotation.set(0.12, 0, 0.18);
        if (bladeMat) bladeMat.emissiveIntensity = 0.0;
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
        const px = p.x * WORLD_SCALE;
        const py = p.y * WORLD_SCALE;
        entry.group.visible = true;
        entry.group.position.set(px, py, 0.1);

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
            this.spawnSparks(px, py, 0xfbbf24, 2, 0.05);
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
            this.spawnSparks(px, py, 0xe11d48, 2, 0.06);
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
            this.spawnSparks(px, py, 0x22d3ee, 3, 0.08);
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
            this.spawnSparks(px, py + 0.1, 0x84cc16, 2, 0.03);
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
            this.spawnSparks(px, py, 0xd946ef, 3, 0.06);
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
            this.spawnSparks(px, py, 0xa855f7, 2, 0.05);
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
            this.spawnSparks(px, py, 0x14b8a6, 2, 0.07);
            this.spawnSparks(px, py, 0xea580c, 1, 0.06);
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
            this.spawnSparks(px, py, 0x60a5fa, 3, 0.07);
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

    const lineMatRed = new THREE.LineBasicMaterial({ color: 0xff3333, depthTest: false });
    const lineMatGreen = new THREE.LineBasicMaterial({ color: 0x22ff66, depthTest: false });
    const lineMatYellow = new THREE.LineBasicMaterial({ color: 0xffee33, depthTest: false });

    for (let i = 0; i < 2; i++) {
      const f = state.fighters[i]!;
      const char = state.chars[i]!;

      const push = getPushbox(f, char);
      this.drawBoxOutline(
        (push.x + push.w / 2) * WORLD_SCALE,
        (push.y + push.h / 2) * WORLD_SCALE,
        push.w * WORLD_SCALE,
        push.h * WORLD_SCALE,
        lineMatYellow
      );

      for (const b of getHurtboxes(f, char)) {
        this.drawBoxOutline(
          (b.x + b.w / 2) * WORLD_SCALE,
          (b.y + b.h / 2) * WORLD_SCALE,
          b.w * WORLD_SCALE,
          b.h * WORLD_SCALE,
          lineMatGreen
        );
      }

      for (const h of getHitboxes(f, char)) {
        this.drawBoxOutline(
          (h.x + h.w / 2) * WORLD_SCALE,
          (h.y + h.h / 2) * WORLD_SCALE,
          h.w * WORLD_SCALE,
          h.h * WORLD_SCALE,
          lineMatRed
        );
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
      new THREE.Vector3(cx - hw, cy - hh, 0.35),
      new THREE.Vector3(cx + hw, cy - hh, 0.35),
      new THREE.Vector3(cx + hw, cy + hh, 0.35),
      new THREE.Vector3(cx - hw, cy + hh, 0.35),
      new THREE.Vector3(cx - hw, cy - hh, 0.35),
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

  private createStageFloorTexture(stageId: string): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base tournament floor tone matching stage ambiance
    ctx.fillStyle = stageId === "fikarum" ? "#292524" : stageId === "konferens" ? "#18181b" : "#0f172a";
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle metallic grid
    ctx.strokeStyle = stageId === "serverrum" ? "rgba(6, 182, 212, 0.22)" : "rgba(245, 158, 11, 0.20)";
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Center Tournament Ring / Octagon
    ctx.strokeStyle = stageId === "serverrum" ? "rgba(56, 189, 248, 0.6)" : "rgba(245, 158, 11, 0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(512, 256, 130, 0, Math.PI * 2);
    ctx.stroke();

    // Center Emblem
    ctx.fillStyle = stageId === "serverrum" ? "rgba(56, 189, 248, 0.85)" : "rgba(245, 158, 11, 0.85)";
    ctx.font = "900 24px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AROS IT-PARTNER", 512, 256);

    // Left and Right stage boundaries
    ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(90, 0);
    ctx.lineTo(90, 512);
    ctx.moveTo(1024 - 90, 0);
    ctx.lineTo(1024 - 90, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
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
    if (this.fighter0.proceduralParts?.shadow) {
      this.scene.remove(this.fighter0.proceduralParts.shadow);
    }
    if (this.fighter1.proceduralParts?.shadow) {
      this.scene.remove(this.fighter1.proceduralParts.shadow);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

interface JointState {
  rx: number;
  ry: number;
  rz: number;
  targetRx: number;
  targetRy: number;
  targetRz: number;
}

interface FighterBodyParts {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  leftShin: THREE.Group;
  rightLeg: THREE.Group;
  rightShin: THREE.Group;
  shadow: THREE.Mesh;
  charId: string;
  props: Record<string, THREE.Object3D>;
  joints: {
    torso: JointState;
    head: JointState;
    leftArm: JointState;
    leftForearm: JointState;
    rightArm: JointState;
    rightForearm: JointState;
    leftLeg: JointState;
    leftShin: JointState;
    rightLeg: JointState;
    rightShin: JointState;
  };
  rootY: { current: number; target: number };
  baseRootY: number;
}
