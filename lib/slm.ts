// Local SLM wrapper — stubbed for next sprint.
// Plan: llama.rn + Phi-3 Mini 4K Instruct GGUF Q4 (~2.2GB), downloaded on first use.

import type { Segment } from '@/types';

export type SummaryResult = {
  summary: string;
  key_takeaways: string[];
};

export const PROMPT_TEMPLATE = (transcriptText: string) => `You are a note-taking assistant. Given the following transcript, return:
1. A concise summary in 3-5 sentences
2. A list of 5-8 key takeaways as short bullet points

Transcript:
${transcriptText}

Respond in this exact JSON format:
{
  "summary": "...",
  "key_takeaways": ["...", "...", "..."]
}`;

export async function summarize(_transcript: Segment[]): Promise<SummaryResult> {
  throw new Error('SLM not yet wired. Coming next sprint via llama.rn + Phi-3 Mini.');
}
