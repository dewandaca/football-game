import { NextResponse } from 'next/server';
import { z } from 'zod';
import groq from '@/lib/groq';

const ResponseSchema = z.object({ topic: z.string().min(5) });

const FALLBACK_POOL = [
  'Pemain terbaik yang pernah bermain di Liga Spanyol',
  'Penyerang terbaik sepanjang masa dalam sejarah sepak bola',
  'Kiper terbaik yang pernah ada dalam sejarah sepak bola',
  'Pemain dengan dribbling paling memukau sepanjang masa',
  'Pemain dengan tendangan bebas paling mematikan',
  'Bek terbaik dalam sejarah sepak bola modern',
  'Gelandang kreatif paling berpengaruh era modern',
  'Kapten timnas paling legendaris di dunia',
  'Striker paling produktif dalam satu musim liga',
  'Pemain legendaris yang tidak pernah memenangkan Ballon d\'Or',
  'Pemain muda paling berbakat yang sedang bersinar saat ini',
  'Pemain yang paling layak disebut GOAT sepak bola',
  'Pemain dengan selebrasi gol paling ikonik sepanjang masa',
  'Pemain berkaki kidal terbaik dalam sejarah sepak bola',
  'Winger dengan kecepatan dan akselerasi paling menakutkan',
  'Pemain sepak bola paling karismatik di dalam dan luar lapangan',
  'Pemain sepak bola asal Asia yang paling sukses di Eropa',
  'Playmaker dengan visi bermain dan umpan paling jenius',
  'Pemain belakang yang paling tangguh dalam duel satu lawan satu',
  'Pemain sepak bola dengan eksekusi penalti paling dingin',
];

const MODELS_TO_TRY = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

const SYSTEM_PROMPT = `You are a football quiz master. Your job is to generate creative, diverse, and engaging football survey topics in Bahasa Indonesia ONLY about football PLAYERS (pemain sepak bola) for a Family Feud style game.

CRITICAL REQUIREMENT:
- The topic MUST be specifically about football PLAYERS (pemain sepak bola).
- Create high variety (positions, eras, skills, iconics, achievements, unique traits, nationalities, celebrations, playstyles).
- Do NOT generate topics about clubs, stadiums, coaches/managers, or general tournaments. Focus 100% on players!

Always respond with valid JSON in this EXACT format:
{"topic": "your topic text here"}`;

export async function GET() {
  for (const model of MODELS_TO_TRY) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'Generate one creative football survey topic.' },
        ],
        temperature: 0.9,
        max_tokens: 100,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      if (!raw) continue;

      const parsed = ResponseSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) continue;

      console.log(`[suggest-topic] OK with model: ${model}`);
      return NextResponse.json({ topic: parsed.data.topic });
    } catch (err) {
      console.warn(`[suggest-topic] Model ${model} failed, trying next...`);
    }
  }

  // All models failed — use curated fallback
  console.log('[suggest-topic] All models failed, using fallback pool');
  const topic = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
  return NextResponse.json({ topic });
}
