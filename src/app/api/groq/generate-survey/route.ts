import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import groq from '@/lib/groq';
import { SURVEY_SYSTEM_PROMPT } from '@/lib/prompts';

const RequestSchema = z.object({
  topic: z.string().min(3).max(200),
  era: z.string().optional(),
});

const AnswerSchema = z.object({
  answer: z.string(),
  aliases: z.array(z.string()),
  points: z.number().int().positive(),
});

const SurveyResponseSchema = z.object({
  question: z.string(),
  answers: z.array(AnswerSchema).min(5).max(10),
});

const MODELS_TO_TRY = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, era } = RequestSchema.parse(body);

    const eraInstruction = era
      ? `\nIMPORTANT ERA CONSTRAINT: Only include players active during: ${era}.`
      : '';

    for (const model of MODELS_TO_TRY) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SURVEY_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Generate a Family 100 survey for this football topic: "${topic}"${eraInstruction}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        });

        const rawContent = completion.choices[0]?.message?.content;
        if (!rawContent) continue;

        const parsed = SurveyResponseSchema.parse(JSON.parse(rawContent));

        // Ensure total points = 100
        const totalPoints = parsed.answers.reduce((sum, a) => sum + a.points, 0);
        if (totalPoints !== 100) {
          const diff = 100 - totalPoints;
          parsed.answers[parsed.answers.length - 1].points += diff;
        }

        console.log(`[generate-survey] OK with model: ${model}`);
        return NextResponse.json(parsed);
      } catch (err) {
        console.warn(`[generate-survey] Model ${model} failed:`, err);
      }
    }

    // Fallback survey if AI fails
    const fallbackAnswers = [
      { answer: 'Lionel Messi', aliases: ['Messi', 'LM10', 'La Pulga'], points: 35 },
      { answer: 'Cristiano Ronaldo', aliases: ['Ronaldo', 'CR7'], points: 30 },
      { answer: 'Kylian Mbappe', aliases: ['Mbappe', 'Donatello'], points: 15 },
      { answer: 'Erling Haaland', aliases: ['Haaland', 'Viking'], points: 12 },
      { answer: 'Neymar Jr', aliases: ['Neymar', 'Ney'], points: 8 },
    ];

    return NextResponse.json({
      question: `Pemain sepak bola terpopuler terkait: ${topic}`,
      answers: fallbackAnswers,
    });
  } catch (error) {
    console.error('Survey generation error:', error);
    return NextResponse.json({ error: 'Failed to generate survey' }, { status: 500 });
  }
}
