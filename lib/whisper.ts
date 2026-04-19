// whisper.rn wrapper — lazy-loaded so Expo Go can run the app without hitting
// the native module. Transcribe calls will throw with a friendly message until
// a dev build is used and the model is bundled. See README for model bundling.

import type { Segment } from '@/types';

type WhisperSegment = { t0: number; t1: number; text: string };
type WhisperContext = {
  transcribe: (
    audioPath: string,
    opts: { language?: string; onProgress?: (p: number) => void },
  ) => { promise: Promise<{ segments: WhisperSegment[] }> };
  release: () => Promise<void>;
};
type WhisperModule = {
  initWhisper: (opts: { filePath: number | string; isBundleAsset?: boolean }) => Promise<WhisperContext>;
};

let _ctx: WhisperContext | null = null;
let _loading: Promise<WhisperContext> | null = null;

export type WhisperModel = 'tiny' | 'base';

// Metro bundles these via require() (see metro.config.js assetExts += 'bin').
// `base` is optional — bundle only if you've downloaded it into assets/models/.
const MODEL_ASSETS: Record<WhisperModel, number | null> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  tiny: require('../assets/models/ggml-tiny.en.bin'),
  base: null,
};

function loadModule(): WhisperModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('whisper.rn') as WhisperModule;
  } catch {
    throw new Error(
      'Transcription requires a dev build. whisper.rn is a native module and is not available in Expo Go. Run `npx expo prebuild && npx expo run:ios` and bundle ggml-tiny.en.bin — see README.',
    );
  }
}

export async function loadWhisper(model: WhisperModel = 'tiny'): Promise<WhisperContext> {
  if (_ctx) return _ctx;
  if (_loading) return _loading;
  const asset = MODEL_ASSETS[model];
  if (asset == null) {
    throw new Error(
      `Whisper ${model} model isn't bundled. Drop ggml-${model}.en.bin into assets/models/ and reload.`,
    );
  }
  const mod = loadModule();
  _loading = (async () => {
    const ctx = await mod.initWhisper({ filePath: asset });
    _ctx = ctx;
    return ctx;
  })();
  return _loading;
}

export async function transcribeFile(
  audioPath: string,
  onProgress?: (pct: number) => void,
): Promise<Segment[]> {
  const ctx = await loadWhisper();
  const { promise } = ctx.transcribe(audioPath, {
    language: 'en',
    onProgress: (p) => onProgress?.(p),
  });
  const result = await promise;
  return result.segments.map((s) => ({
    start: s.t0 / 100,
    end: s.t1 / 100,
    text: s.text.trim(),
  }));
}

export async function unloadWhisper() {
  if (_ctx) {
    await _ctx.release();
    _ctx = null;
    _loading = null;
  }
}
