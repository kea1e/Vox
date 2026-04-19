// whisper.rn wrapper — initializes the model once and exposes a transcribe() helper.
//
// Model files (ggml-tiny.en.bin / ggml-base.en.bin) must be bundled into the
// native app under ios/Resources or android/app/src/main/assets. See README for
// the model bundling step. Until the model is bundled, transcribe() throws.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Whisper = require('whisper.rn') as {
  initWhisper: (opts: { filePath: number | string; isBundleAsset?: boolean }) => Promise<WhisperContext>;
};

type WhisperSegment = { t0: number; t1: number; text: string };
type WhisperContext = {
  transcribe: (
    audioPath: string,
    opts: { language?: string; onProgress?: (p: number) => void },
  ) => { promise: Promise<{ segments: WhisperSegment[] }> };
  release: () => Promise<void>;
};

import type { Segment } from '@/types';

let _ctx: WhisperContext | null = null;
let _loading: Promise<WhisperContext> | null = null;

export type WhisperModel = 'tiny' | 'base';

const MODEL_FILES: Record<WhisperModel, string> = {
  tiny: 'ggml-tiny.en.bin',
  base: 'ggml-base.en.bin',
};

export async function loadWhisper(model: WhisperModel = 'tiny'): Promise<WhisperContext> {
  if (_ctx) return _ctx;
  if (_loading) return _loading;
  _loading = (async () => {
    const ctx = await Whisper.initWhisper({
      filePath: MODEL_FILES[model],
      isBundleAsset: true,
    });
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
