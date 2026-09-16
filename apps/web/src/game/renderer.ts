import * as THREE from "three";
import type { CharacterDef, StageDef } from "@aipuf/contracts";
import type { FighterRuntime, MatchState, ProjectileRuntime } from "@aipuf/sim";

export interface RendererOptions {
  container: HTMLDivElement;
  showBoxes?: boolean;
}

export class GameRenderer {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Background layers
  private bgMeshBack: THREE.Mesh | null = null;
  private bgMeshMid: THREE.Mesh | null = null;
  private floorMesh: THREE.Mesh | null = null;

  // Fighter models
  private fighter0Group: THREE.Group;
  private fighter1Group: THREE.Group;
  private f0Parts: FighterBodyParts;
  private f1Parts: FighterBodyParts;

  // Projectile meshes
  private projectilePool: THREE.Mesh[] = [];

  // VFX
  private sparkGroup: THREE.Group;
  private sparks: Array<{ mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vy: number }> = [];

  // Debug box helpers
  private debugBoxGroup: THREE.Group;
  public showBoxes = false;

  private currentStageId = "";

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.showBoxes = options.showBoxes ?? false;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);

    // Camera
    const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    this.camera.position.set(0, 1.8, 6.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 8, 6);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fillLight.position.set(-4, 3, -2);
    this.scene.add(fillLight);

    // Groups
    this.fighter0Group = new THREE.Group();
    this.fighter1Group = new THREE.Group();
    this.scene.add(this.fighter0Group);
    this.scene.add(this.fighter1Group);

    this.f0Parts = this.buildFighterModel(this.fighter0Group, "#2563eb", "#60a5fa");
    this.f1Parts = this.buildFighterModel(this.fighter1Group, "#dc2626", "#f87171");

    this.sparkGroup = new THREE.Group();
    this.scene.add(this.sparkGroup);

    this.debugBoxGroup = new THREE.Group();
    this.scene.add(this.debugBoxGroup);

    this.setupStage("serverrum");

    window.addEventListener("resize", this.onWindowResize);
  }

  public setupFighterModels(char0: CharacterDef, char1: CharacterDef): void {
    this.fighter0Group.clear();
    this.fighter1Group.clear();
    this.f0Parts = this.buildFighterModel(this.fighter0Group, char0.colors[0], char0.colors[1], char0.archetype);
    this.f1Parts = this.buildFighterModel(this.fighter1Group, char1.colors[0], char1.colors[1], char1.archetype);
  }

  public setupStage(stageId: string): void {
    if (this.currentStageId === stageId) return;
    this.currentStageId = stageId;

    if (this.bgMeshBack) this.scene.remove(this.bgMeshBack);
    if (this.bgMeshMid) this.scene.remove(this.bgMeshMid);
    if (this.floorMesh) this.scene.remove(this.floorMesh);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(24, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, 0);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Mid parallax background
    const midGeo = new THREE.PlaneGeometry(28, 10);
    const midTexture = this.createStageTexture(stageId, "mid");
    const midMat = new THREE.MeshBasicMaterial({
      map: midTexture,
      transparent: true,
      opacity: 0.9,
    });
    this.bgMeshMid = new THREE.Mesh(midGeo, midMat);
    this.bgMeshMid.position.set(0, 3.5, -3.5);
    this.scene.add(this.bgMeshMid);

    // Back parallax background
    const backGeo = new THREE.PlaneGeometry(36, 12);
    const backTexture = this.createStageTexture(stageId, "back");
    const backMat = new THREE.MeshBasicMaterial({
      map: backTexture,
    });
    this.bgMeshBack = new THREE.Mesh(backGeo, backMat);
    this.bgMeshBack.position.set(0, 4.5, -6.5);
    this.scene.add(this.bgMeshBack);
  }

  public renderMatch(state: MatchState): void {
    const f0 = state.fighters[0];
    const f1 = state.fighters[1];

    // Subunit to world meter conversion: 1000 subunits = 1 meter
    const pos0X = f0.x / 1000;
    const pos0Y = f0.y / 1000;
    const pos1X = f1.x / 1000;
    const pos1Y = f1.y / 1000;

    this.fighter0Group.position.set(pos0X, pos0Y, 0);
    this.fighter0Group.scale.set(f0.facing, 1, 1);

    this.fighter1Group.position.set(pos1X, pos1Y, 0);
    this.fighter1Group.scale.set(f1.facing, 1, 1);

    // Animate body parts
    this.poseFighter(this.f0Parts, f0);
    this.poseFighter(this.f1Parts, f1);

    // Camera follow midpoint
    const midX = (pos0X + pos1X) / 2;
    const dist = Math.abs(pos0X - pos1X);
    const targetCamX = midX;
    const targetCamZ = Math.max(5.5, Math.min(8.5, 5.0 + dist * 0.7));

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.1;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1;
    this.camera.lookAt(this.camera.position.x, 1.4, 0);

    // Parallax shift for backgrounds
    if (this.bgMeshMid) {
      this.bgMeshMid.position.x = this.camera.position.x * 0.4;
    }
    if (this.bgMeshBack) {
      this.bgMeshBack.position.x = this.camera.position.x * 0.15;
    }

    // Render projectiles
    this.renderProjectiles(state.projectiles);

    // Render event VFX (hits, sparks, blocks)
    for (const ev of state.events) {
      if (ev.kind === "hit") {
        const victim = ev.source === 0 ? f1 : f0;
        this.spawnSparks(victim.x / 1000, victim.y / 1000 + 1.2, 0xffe600, 12);
      } else if (ev.kind === "block") {
        const blocker = ev.source === 0 ? f0 : f1;
        this.spawnSparks(blocker.x / 1000, blocker.y / 1000 + 1.2, 0x38bdf8, 8);
      } else if (ev.kind === "super") {
        const user = ev.source === 0 ? f0 : f1;
        this.spawnSparks(user.x / 1000, user.y / 1000 + 1.0, 0xa855f7, 24);
      }
    }

    this.updateSparks();

    // Render debug boxes if enabled
    if (this.showBoxes) {
      this.renderDebugBoxes(state);
    } else {
      this.debugBoxGroup.clear();
    }

    this.renderer.render(this.scene, this.camera);
  }

  // --- Fighter 3D Rig & Pose ---

  private buildFighterModel(
    parent: THREE.Group,
    primaryColor: string,
    secondaryColor: string,
    archetype: string = "shoto-a"
  ): FighterBodyParts {
    const pMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.4,
      metalness: 0.3,
    });
    const sMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.5,
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
    root.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const head = new THREE.Mesh(headGeo, sMat);
    head.position.set(0, 0.4, 0);
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
    leftArmGroup.add(lUpperArm);

    const lForearmGroup = new THREE.Group();
    lForearmGroup.position.set(0, -0.26, 0);
    leftArmGroup.add(lForearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8);
    const lForearm = new THREE.Mesh(forearmGeo, pMat);
    lForearm.position.set(0, -0.13, 0);
    lForearmGroup.add(lForearm);

    // Right Arm (Front arm)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0, 0.18, 0.18);
    torso.add(rightArmGroup);

    const rUpperArm = new THREE.Mesh(upperArmGeo, sMat);
    rUpperArm.position.set(0, -0.14, 0);
    rightArmGroup.add(rUpperArm);

    const rForearmGroup = new THREE.Group();
    rForearmGroup.position.set(0, -0.26, 0);
    rightArmGroup.add(rForearmGroup);

    const rForearm = new THREE.Mesh(forearmGeo, pMat);
    rForearm.position.set(0, -0.13, 0);
    rForearmGroup.add(rForearm);

    // Pelvis
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.22), jointMat);
    pelvis.position.set(0, -0.3, 0);
    torso.add(pelvis);

    // Left Leg (Back leg)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0, -0.08, -0.11);
    pelvis.add(leftLegGroup);

    const thighGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.38, 8);
    const lThigh = new THREE.Mesh(thighGeo, pMat);
    lThigh.position.set(0, -0.19, 0);
    leftLegGroup.add(lThigh);

    const lShinGroup = new THREE.Group();
    lShinGroup.position.set(0, -0.36, 0);
    leftLegGroup.add(lShinGroup);

    const shinGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.38, 8);
    const lShin = new THREE.Mesh(shinGeo, sMat);
    lShin.position.set(0, -0.19, 0);
    lShinGroup.add(lShin);

    // Right Leg (Front leg)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0, -0.08, 0.11);
    pelvis.add(rightLegGroup);

    const rThigh = new THREE.Mesh(thighGeo, pMat);
    rThigh.position.set(0, -0.19, 0);
    rightLegGroup.add(rThigh);

    const rShinGroup = new THREE.Group();
    rShinGroup.position.set(0, -0.36, 0);
    rightLegGroup.add(rShinGroup);

    const rShin = new THREE.Mesh(shinGeo, sMat);
    rShin.position.set(0, -0.19, 0);
    rShinGroup.add(rShin);

    // Archetype specific accessory
    if (archetype.startsWith("grappler")) {
      const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), sMat);
      shoulderPad.position.set(0, 0.1, 0);
      rightArmGroup.add(shoulderPad);
    } else if (archetype.startsWith("hybrid")) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), sMat);
      wing.rotation.x = Math.PI / 2;
      wing.position.set(-0.15, 0.1, 0);
      torso.add(wing);
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

  private poseFighter(parts: FighterBodyParts, fighter: FighterRuntime): void {
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
        parts.rightArm.rotation.z = 0.8; // Guard raised while walking back
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
        parts.rightArm.rotation.z = 2.8; // arm raised in triumph
        parts.leftArm.rotation.z = 0.3;
        break;
      }
      case "ko": {
        parts.root.position.y = -0.85;
        parts.root.rotation.x = Math.PI / 2;
        break;
      }
      case "attackStartup": {
        parts.torso.rotation.z = -0.2;
        parts.rightArm.rotation.z = -0.6;
        parts.rightForearm.rotation.z = -0.9;
        break;
      }
      case "attackActive": {
        parts.torso.rotation.z = 0.35;
        parts.rightArm.rotation.z = 1.5; // punch forward!
        parts.rightForearm.rotation.z = 0.1;
        parts.leftArm.rotation.z = -0.4;
        parts.leftLeg.rotation.z = -0.4;
        parts.rightLeg.rotation.z = 0.5;
        break;
      }
      case "attackRecovery": {
        parts.torso.rotation.z = 0.1;
        parts.rightArm.rotation.z = 0.8;
        parts.rightForearm.rotation.z = -0.6;
        break;
      }
    }
  }

  // --- Projectiles ---

  private renderProjectiles(projectiles: ProjectileRuntime[]): void {
    // Resize pool if needed
    while (this.projectilePool.length < projectiles.length) {
      const pGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mesh = new THREE.Mesh(pGeo, pMat);
      this.scene.add(mesh);
      this.projectilePool.push(mesh);
    }

    for (let i = 0; i < this.projectilePool.length; i++) {
      const mesh = this.projectilePool[i]!;
      if (i < projectiles.length) {
        const p = projectiles[i]!;
        mesh.visible = true;
        mesh.position.set(p.x / 1000, p.y / 1000, 0);
        // Change color based on kind
        if (p.kind === "zone") {
          mesh.scale.set(1.5, 2.5, 0.5);
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
        } else {
          mesh.scale.set(1, 1, 1);
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        }
      } else {
        mesh.visible = false;
      }
    }
  }

  // --- Particle VFX ---

  private spawnSparks(x: number, y: number, colorHex: number, count: number): void {
    const geo = new THREE.PlaneGeometry(0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0.1);
      this.sparkGroup.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.12;

      this.sparks.push({
        mesh,
        life: 0,
        maxLife: 10 + Math.random() * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  private updateSparks(): void {
    const alive: typeof this.sparks = [];
    for (const s of this.sparks) {
      s.life++;
      s.mesh.position.x += s.vx;
      s.mesh.position.y += s.vy;
      s.mesh.rotation.z += 0.2;
      const scale = 1 - s.life / s.maxLife;
      s.mesh.scale.set(scale, scale, 1);

      if (s.life < s.maxLife) {
        alive.push(s);
      } else {
        this.sparkGroup.remove(s.mesh);
      }
    }
    this.sparks = alive;
  }

  // --- Debug Boxes ---

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

  // --- Stage Texture Generator ---

  private createStageTexture(stageId: string, layer: "mid" | "back"): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    if (layer === "back") {
      // Atmospheric gradient
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

      // Distant building windows / lights
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      for (let i = 0; i < 40; i++) {
        const x = (i * 28) % 1024;
        const y = 100 + ((i * 37) % 250);
        ctx.fillRect(x, y, 14, 8);
      }
    } else {
      // Midground: Transparent canvas with architectural silhouettes
      ctx.clearRect(0, 0, 1024, 512);

      if (stageId === "serverrum") {
        // Server racks with glowing LEDs
        for (let r = 0; r < 8; r++) {
          const rx = 60 + r * 120;
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(rx, 160, 90, 350);
          ctx.strokeStyle = "#334155";
          ctx.strokeRect(rx, 160, 90, 350);

          // LED lights
          for (let row = 0; row < 12; row++) {
            ctx.fillStyle = (r + row) % 3 === 0 ? "#22c55e" : (r + row) % 4 === 0 ? "#3b82f6" : "#f59e0b";
            ctx.fillRect(rx + 15, 180 + row * 24, 6, 4);
            ctx.fillRect(rx + 30, 180 + row * 24, 6, 4);
          }
        }
      } else if (stageId === "fikarum") {
        // Coffee bar, snack machine, chairs
        ctx.fillStyle = "#44403c";
        ctx.fillRect(150, 240, 280, 270); // Counter
        ctx.fillStyle = "#78716c";
        ctx.fillRect(200, 180, 120, 60); // Coffee machine
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(600, 150, 180, 360); // Vending machine
      } else if (stageId === "kontor") {
        // Desks with monitors
        for (let d = 0; d < 4; d++) {
          const dx = 80 + d * 240;
          ctx.fillStyle = "#334155";
          ctx.fillRect(dx, 320, 180, 190); // Desk
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(dx + 50, 220, 80, 55); // Monitor glowing screen
          ctx.fillStyle = "#64748b";
          ctx.fillRect(dx + 85, 275, 10, 45); // Stand
        }
      } else {
        // Konferens: Boardroom table and screen
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(200, 100, 624, 200); // Big projector screen
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("AROS IT-PARTNER STRATEGI", 280, 210);
        ctx.fillStyle = "#312e81";
        ctx.fillRect(100, 340, 824, 170); // Conference table
      }
    }

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
