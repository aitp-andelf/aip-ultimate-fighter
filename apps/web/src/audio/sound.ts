/**
 * Web Audio API Sound Synthesizer.
 * Completely self-contained: generates crisp arcade fighting sound effects
 * and procedural synth BGM with zero external file dependencies.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  public enabled = true;
  public sfxVolume = 0.8;
  public bgmVolume = 0.4;

  private init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  public setBgmVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain) this.bgmGain.gain.value = this.bgmVolume;
  }

  // --- Sound Effects ---

  public playHit(heavy: boolean): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = heavy ? "sawtooth" : "triangle";
      const startFreq = heavy ? 180 : 280;
      const endFreq = heavy ? 40 : 80;
      const duration = heavy ? 0.18 : 0.1;

      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(ctx.currentTime + duration);

      // Add noise burst for crunch
      this.playNoise(heavy ? 0.15 : 0.07, 0.4);
    } catch {}
  }

  public playBlock(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  public playWhoosh(): void {
    if (!this.enabled) return;
    this.playNoise(0.12, 0.25);
  }

  public playJump(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  public playSuper(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      // Super activation chord / chime
      const notes = [440, 554.37, 659.25, 880];
      for (let i = 0; i < notes.length; i++) {
        const freq = notes[i]!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.4);
      }
    } catch {}
  }

  public playKo(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      // Low gong
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      this.announce("K.O.!");
    } catch {}
  }

  public playRoundStart(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      this.announce("FIGHT!");
    } catch {}
  }

  public announce(text: string): void {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 0.9;
      utterance.volume = Math.min(1.0, this.sfxVolume * 1.2);
      const voices = window.speechSynthesis.getVoices();
      const english = voices.find(
        (v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("whisper")
      );
      if (english) utterance.voice = english;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  public playUiClick(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  private playNoise(duration: number, volume: number): void {
    try {
      const ctx = this.init();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      noise.start();
      noise.stop(ctx.currentTime + duration);
    } catch {}
  }

  // --- Arcade BGM Synthesizer ---

  public startBgm(): void {
    if (this.bgmTimer !== null) return;
    this.bgmStep = 0;

    // Bassline notes for energetic arcade beat (in Hz: E2, G2, A2, B2)
    const bassline = [82.41, 82.41, 98.0, 82.41, 110.0, 98.0, 123.47, 110.0];

    this.bgmTimer = window.setInterval(() => {
      if (!this.enabled || this.bgmVolume <= 0) return;
      try {
        const ctx = this.init();
        const note = bassline[this.bgmStep % bassline.length]!;

        // Bass synth
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(note, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain!);

        osc.start();
        osc.stop(ctx.currentTime + 0.14);

        // Hi-hat noise on offbeats
        if (this.bgmStep % 2 === 1) {
          this.playNoise(0.03, 0.08);
        }

        this.bgmStep++;
      } catch {}
    }, 150); // 100 BPM 16th notes / 200 BPM 8th notes
  }

  public stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const sound = new SoundSystem();
