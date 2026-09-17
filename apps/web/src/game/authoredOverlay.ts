import * as THREE from "three";

/** Local TRS snapshot for one overlay bone (clean mixer pose). */
export interface BonePoseSnapshot {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export type OverlayBoneMap = {
  hip: THREE.Object3D;
  lThigh: THREE.Object3D | null;
  rThigh: THREE.Object3D | null;
  lUpper: THREE.Object3D | null;
  rUpper: THREE.Object3D | null;
  lFore: THREE.Object3D | null;
  rFore: THREE.Object3D | null;
};

export type CleanPoseCache = {
  hip: BonePoseSnapshot;
  lThigh: BonePoseSnapshot | null;
  rThigh: BonePoseSnapshot | null;
  lUpper: BonePoseSnapshot | null;
  rUpper: BonePoseSnapshot | null;
  lFore: BonePoseSnapshot | null;
  rFore: BonePoseSnapshot | null;
};

export function capturePose(obj: THREE.Object3D): BonePoseSnapshot {
  return {
    position: obj.position.clone(),
    quaternion: obj.quaternion.clone(),
    scale: obj.scale.clone(),
  };
}

export function restorePose(obj: THREE.Object3D, pose: BonePoseSnapshot): void {
  obj.position.copy(pose.position);
  obj.quaternion.copy(pose.quaternion);
  obj.scale.copy(pose.scale);
}

export function captureCleanPose(bones: OverlayBoneMap): CleanPoseCache {
  return {
    hip: capturePose(bones.hip),
    lThigh: bones.lThigh ? capturePose(bones.lThigh) : null,
    rThigh: bones.rThigh ? capturePose(bones.rThigh) : null,
    lUpper: bones.lUpper ? capturePose(bones.lUpper) : null,
    rUpper: bones.rUpper ? capturePose(bones.rUpper) : null,
    lFore: bones.lFore ? capturePose(bones.lFore) : null,
    rFore: bones.rFore ? capturePose(bones.rFore) : null,
  };
}

export function restoreCleanPose(bones: OverlayBoneMap, cache: CleanPoseCache): void {
  restorePose(bones.hip, cache.hip);
  if (bones.lThigh && cache.lThigh) restorePose(bones.lThigh, cache.lThigh);
  if (bones.rThigh && cache.rThigh) restorePose(bones.rThigh, cache.rThigh);
  if (bones.lUpper && cache.lUpper) restorePose(bones.lUpper, cache.lUpper);
  if (bones.rUpper && cache.rUpper) restorePose(bones.rUpper, cache.rUpper);
  if (bones.lFore && cache.lFore) restorePose(bones.lFore, cache.lFore);
  if (bones.rFore && cache.rFore) restorePose(bones.rFore, cache.rFore);
}

/** Relative arm uncross used by the runtime overlay (radians). */
export function applyArmUncross(
  bones: Pick<OverlayBoneMap, "lUpper" | "rUpper" | "lFore" | "rFore">,
  walking: boolean
): void {
  if (walking) {
    bones.lUpper?.rotateX(-0.82);
    bones.rUpper?.rotateX(-0.95);
    bones.lFore?.rotateX(-0.52);
    bones.rFore?.rotateX(-0.62);
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

/**
 * Prove relative rotateX accumulates when the previous overlay is not restored
 * (hit-stop / PropertyMixer no-op path). With restore, N applications match one.
 */
export function measureArmOverlayAccumulation(iterations: number, restoreEach: boolean): number {
  const bone = new THREE.Object3D();
  bone.rotation.set(0.1, 0.05, 0);
  const clean = capturePose(bone);
  for (let i = 0; i < iterations; i++) {
    if (restoreEach) restorePose(bone, clean);
    bone.rotateX(-0.52);
  }
  return bone.rotation.x;
}

export type RigDiagMode = "off" | "A" | "B" | "C" | "D";

export function parseRigDiagMode(raw: string | null | undefined): RigDiagMode {
  const v = (raw ?? "off").trim().toUpperCase();
  if (v === "A" || v === "B" || v === "C" || v === "D") return v;
  return "off";
}
