import { Injectable } from '@angular/core';

@Injectable()
export class AdminSoundService {
  private audioContext: AudioContext | null = null;

  playNewOrder(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }
    const now = ctx.currentTime;
    this.beep(ctx, 880, now, 0.12);
    this.beep(ctx, 1320, now + 0.14, 0.16);
  }

  private ensureContext(): AudioContext | null {
    if (!this.audioContext) {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }
      this.audioContext = new AudioCtor();
    }
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
    return this.audioContext;
  }

  private beep(
    ctx: AudioContext,
    frequency: number,
    startAt: number,
    duration: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }
}
