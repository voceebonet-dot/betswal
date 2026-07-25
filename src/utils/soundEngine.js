class AviatorSoundEngine {
  constructor() {
    this.ctx = null;
    this.flightOsc = null;
    this.flightGain = null;
    this.muted = false;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.enabled = true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.flightGain) {
      this.flightGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    } else if (!this.muted && this.flightGain && this.flightOsc) {
      this.flightGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  _playTone(freq, type, duration, vol = 0.1) {
    if (!this.enabled || this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  playTick() {
    this._playTone(800, 'sine', 0.1, 0.05);
  }

  playBet() {
    this._playTone(400, 'sine', 0.1, 0.05);
    setTimeout(() => this._playTone(600, 'sine', 0.15, 0.05), 100);
  }

  playCashout() {
    this._playTone(1200, 'sine', 0.1, 0.1);
    setTimeout(() => this._playTone(1600, 'sine', 0.3, 0.1), 100);
  }

  playCrash() {
    if (!this.enabled || this.muted || !this.ctx) return;
    this.stopFlight();
    
    try {
      const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noise.start();
    } catch (e) {
      console.warn('Crash sound failed', e);
    }
  }

  startFlight() {
    if (!this.enabled || this.muted || !this.ctx) return;
    if (this.flightOsc) this.stopFlight();
    
    try {
      this.flightOsc = this.ctx.createOscillator();
      this.flightGain = this.ctx.createGain();
      
      this.flightOsc.type = 'sawtooth';
      this.flightOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
      
      this.flightGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.flightGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      
      this.flightOsc.connect(filter);
      filter.connect(this.flightGain);
      this.flightGain.connect(this.ctx.destination);
      
      this.flightOsc.start();
    } catch (e) {
      console.warn('Flight sound failed', e);
    }
  }

  updateFlight(multiplier) {
    if (!this.flightOsc || this.muted || !this.ctx) return;
    try {
      const targetFreq = Math.min(100 + (multiplier * 15), 400);
      this.flightOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch (e) {}
  }

  stopFlight() {
    if (this.flightOsc && this.flightGain && this.ctx) {
      try {
        this.flightGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        const osc = this.flightOsc;
        setTimeout(() => {
          try { osc.stop(); osc.disconnect(); } catch(e){}
        }, 100);
      } catch (e) {}
      this.flightOsc = null;
      this.flightGain = null;
    }
  }
}

export const soundEngine = new AviatorSoundEngine();
