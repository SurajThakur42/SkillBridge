/**
 * Neural Audio Recorder & VAD (Voice Activity Detection) Streamer
 * Captures high-definition microphone audio for Whisper/Gemini Neural Speech processing.
 */

export interface NeuralAudioConfig {
  silenceThresholdMs?: number; // Time of silence before auto-submitting (e.g. 1200ms)
  minDecibels?: number; // Volume threshold for speaking vs silence
  onAudioLevel?: (level: number) => void;
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export class NeuralAudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isRecording: boolean = false;
  private isProcessing: boolean = false;
  private silenceTimer: any = null;
  private speechDetected: boolean = false;

  private config: NeuralAudioConfig;

  constructor(config: NeuralAudioConfig = {}) {
    this.config = {
      silenceThresholdMs: 900,
      minDecibels: -48,
      ...config
    };
  }

  /**
   * Check if MediaRecorder & audio input is available
   */
  public static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Start recording audio from user microphone
   */
  public async startRecording(): Promise<boolean> {
    if (this.isRecording) return true;

    try {
      this.audioChunks = [];
      this.speechDetected = false;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });

      // Set up Web Audio Analyser for VAD & UI visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      // Determine supported mime type (prefer webm/opus or mp4)
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                   MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
                   MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : '';
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, mimeType ? { mimeType } : undefined);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(150);
      this.isRecording = true;

      // Start volume monitor loop & VAD
      this.monitorAudioLevel();
      return true;
    } catch (err: any) {
      console.error('Failed to start Neural Audio recording:', err);
      if (this.config.onError) this.config.onError(err);
      this.cleanup();
      return false;
    }
  }

  /**
   * Audio level monitor loop for live wave visualizer & silence detection
   */
  private monitorAudioLevel(): void {
    if (!this.analyser || !this.isRecording) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length; // 0 to 255
    const normalizedLevel = Math.min(1.0, avg / 120);

    if (this.config.onAudioLevel) {
      this.config.onAudioLevel(normalizedLevel);
    }

    // Voice Activity Detection (VAD)
    const isSpeakingNow = normalizedLevel > 0.08;
    if (isSpeakingNow) {
      this.speechDetected = true;
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    } else if (this.speechDetected && !this.silenceTimer) {
      // User was speaking and now went silent -> start countdown to finalize
      this.silenceTimer = setTimeout(() => {
        if (this.isRecording && this.speechDetected) {
          this.stopAndTranscribe();
        }
      }, this.config.silenceThresholdMs);
    }

    this.animFrameId = requestAnimationFrame(() => this.monitorAudioLevel());
  }

  /**
   * Stop recording, package audio, and send to backend Neural AI
   */
  public async stopAndTranscribe(context: { currentPath?: string; currentRole?: string } = {}): Promise<any> {
    if (!this.isRecording || this.isProcessing) return null;

    this.isProcessing = true;
    if (this.config.onTranscriptionStart) {
      this.config.onTranscriptionStart();
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.audioChunks, { type: mimeType });

          if (blob.size < 1000) {
            // Audio too short / no meaningful speech
            this.cleanup();
            resolve({ transcript: '', action: 'UNKNOWN', confidence: 0, spokenFeedback: 'No speech detected' });
            return;
          }

          // Convert Blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Data = reader.result as string;

            try {
              const res = await fetch('/api/ai/voice-transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audio: base64Data,
                  mimeType,
                  currentPath: context.currentPath || window.location.pathname,
                  currentRole: context.currentRole || 'LEARNER'
                })
              });

              if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
              }

              const result = await res.json();
              if (this.config.onTranscriptionComplete) {
                this.config.onTranscriptionComplete(result);
              }
              resolve(result);
            } catch (err: any) {
              console.error('Neural voice transcription request error:', err);
              if (this.config.onError) this.config.onError(err);
              resolve(null);
            } finally {
              this.cleanup();
            }
          };
        } catch (err: any) {
          console.error('Error packaging audio blob:', err);
          this.cleanup();
          resolve(null);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanup();
        resolve(null);
      }
    });
  }

  /**
   * Cancel and discard recording
   */
  public cancel(): void {
    this.cleanup();
  }

  /**
   * Clean up hardware streams and audio contexts
   */
  private cleanup(): void {
    this.isRecording = false;
    this.isProcessing = false;
    this.speechDetected = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}
