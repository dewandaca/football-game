import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import groq from '@/lib/groq';
import { DRAFT_SYSTEM_PROMPT } from '@/lib/prompts';

const RequestSchema = z.object({
  budget: z.number().int().min(10000).max(1000000),
  theme: z.string().max(100).optional(),
});

const PlayerSchema = z.object({
  name: z.string(),
  club: z.string(),
  rating: z.number().int().min(60).max(99),
  price: z.number().int().positive(),
});

const RoundSchema = z.object({
  round: z.number().int(),
  position: z.string(),
  playerA: PlayerSchema,
  playerB: PlayerSchema,
});

const DraftResponseSchema = z.object({
  totalBudgetPerUser: z.number(),
  rounds: z.array(RoundSchema).min(11).max(11),
});

const POSITIONS_433 = ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CDM', 'RW', 'ST', 'LW'];
const MODELS_TO_TRY = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

function extractJSON(text: string): string {
  const mdMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (mdMatch) return mdMatch[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

export async function POST(request: NextRequest) {
  let requestedBudget = 50000;
  let requestedTheme = 'top_tier';
  try {
    const body = await request.json();
    const { budget, theme } = RequestSchema.parse(body);
    requestedBudget = budget;
    if (theme) requestedTheme = theme;

    let tierPromptInstruction = '';
    if (requestedTheme === 'normal_tier') {
      tierPromptInstruction = ` CATEGORY CONSTRAINT: Focus ONLY on solid real-world professional football players from top European leagues who are LESS hyped by media or underrated (ratings 75-84). Examples: Jarrod Bowen, James Ward-Prowse, Rodrigo Muniz, Alex Grimaldo, Bryan Mbeumo, Lucas Paquetá, Bryan Cristante, Unai Simón, Lewis Dunk, Pedro Neto, Dominic Solanke. ALL players MUST be real professional football players. DO NOT invent fake names.`;
    } else if (requestedTheme === 'mix_tier') {
      tierPromptInstruction = ` CATEGORY CONSTRAINT: Provide a mix of famous world-class superstars AND high-quality underrated media gems (ratings 80-88). Examples: Bruno Guimarães, Nico Williams, Ollie Watkins, Alexis Mac Allister, Nicolò Barella, Son Heung-min, Alessandro Bastoni, Mike Maignan, Alejandro Grimaldo. ALL players MUST be real professional football players.`;
    } else {
      // top_tier
      tierPromptInstruction = ` CATEGORY CONSTRAINT: Focus ONLY on famous world-class superstar football players (ratings 86-94). Examples: Kylian Mbappé, Erling Haaland, Vinícius Júnior, Jude Bellingham, Mohamed Salah, Rodri, Kevin De Bruyne, Harry Kane, Bukayo Saka, Virgil van Dijk, Thibaut Courtois. ALL players MUST be real professional football players.`;
    }

    for (const model of MODELS_TO_TRY) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: DRAFT_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Generate 11 rounds of real football player pairs for a 4-3-3 draft with a budget of ${budget} per user.${tierPromptInstruction}
Positions in order: ${POSITIONS_433.join(', ')}.
Target total cost of 11 chosen players ≈ ${Math.floor(budget * 0.92)}.
CRITICAL: All names MUST be REAL real-world football players from professional clubs.
Output ONLY a raw JSON object matching the exact schema.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 3500,
        });

        const rawContent = completion.choices[0]?.message?.content;
        if (!rawContent) continue;

        const jsonStr = extractJSON(rawContent);
        const parsed = DraftResponseSchema.parse(JSON.parse(jsonStr));

        const rounds = parsed.rounds.map((round, i) => ({
          ...round,
          position: POSITIONS_433[i] ?? round.position,
          playerA: { ...round.playerA, id: `p1-r${i}`, position: POSITIONS_433[i] ?? round.position },
          playerB: { ...round.playerB, id: `p2-r${i}`, position: POSITIONS_433[i] ?? round.position },
        }));

        console.log(`[generate-draft] OK with model: ${model} (Category: ${requestedTheme})`);
        return NextResponse.json({ ...parsed, rounds });
      } catch (err) {
        console.warn(`[generate-draft] Model ${model} failed:`, err);
      }
    }

    // Fallback draft generator using curated real player pools
    console.log(`[generate-draft] Using curated fallback generator for theme: ${requestedTheme}`);
    const fallbackRounds = generateFallbackDraft(requestedBudget, requestedTheme);
    return NextResponse.json({
      totalBudgetPerUser: requestedBudget,
      rounds: fallbackRounds,
    });
  } catch (error) {
    console.error('Draft generation error:', error);
    const fallbackRounds = generateFallbackDraft(requestedBudget, requestedTheme);
    return NextResponse.json({
      totalBudgetPerUser: requestedBudget,
      rounds: fallbackRounds,
    });
  }
}

/**
 * Curated Real Professional Football Player Pools
 * Guaranteed 100% REAL professional players across 3 categories. Zero fake names!
 */
function generateFallbackDraft(budget: number, theme: string) {
  const basePricePerPlayer = Math.floor((budget * 0.9) / 11);

  // 1. World-Class Superstars Pool (top_tier)
  const topTierPool: Record<string, Array<{ name: string; club: string; rating: number }>> = {
    GK: [
      { name: 'Thibaut Courtois', club: 'Real Madrid', rating: 90 },
      { name: 'Alisson Becker', club: 'Liverpool', rating: 89 },
      { name: 'Gianluigi Donnarumma', club: 'PSG', rating: 88 },
      { name: 'Marc-André ter Stegen', club: 'Barcelona', rating: 87 },
    ],
    RB: [
      { name: 'Achraf Hakimi', club: 'PSG', rating: 87 },
      { name: 'Trent Alexander-Arnold', club: 'Liverpool', rating: 86 },
      { name: 'Dani Carvajal', club: 'Real Madrid', rating: 86 },
      { name: 'Reece James', club: 'Chelsea', rating: 85 },
    ],
    CB: [
      { name: 'Virgil van Dijk', club: 'Liverpool', rating: 89 },
      { name: 'Ruben Dias', club: 'Manchester City', rating: 88 },
      { name: 'Antonio Rüdiger', club: 'Real Madrid', rating: 87 },
      { name: 'William Saliba', club: 'Arsenal', rating: 87 },
    ],
    LB: [
      { name: 'Alphonso Davies', club: 'Bayern Munich', rating: 85 },
      { name: 'Theo Hernandez', club: 'AC Milan', rating: 86 },
      { name: 'Federico Dimarco', club: 'Inter Milan', rating: 85 },
      { name: 'Andrew Robertson', club: 'Liverpool', rating: 85 },
    ],
    CDM: [
      { name: 'Rodri', club: 'Manchester City', rating: 91 },
      { name: 'Declan Rice', club: 'Arsenal', rating: 88 },
      { name: 'Aurélien Tchouaméni', club: 'Real Madrid', rating: 86 },
      { name: 'Joshua Kimmich', club: 'Bayern Munich', rating: 88 },
    ],
    CM: [
      { name: 'Jude Bellingham', club: 'Real Madrid', rating: 90 },
      { name: 'Kevin De Bruyne', club: 'Manchester City', rating: 90 },
      { name: 'Pedri', club: 'Barcelona', rating: 87 },
      { name: 'Federico Valverde', club: 'Real Madrid', rating: 88 },
    ],
    RW: [
      { name: 'Mohamed Salah', club: 'Liverpool', rating: 89 },
      { name: 'Bukayo Saka', club: 'Arsenal', rating: 88 },
      { name: 'Rodrygo', club: 'Real Madrid', rating: 86 },
      { name: 'Lamine Yamal', club: 'Barcelona', rating: 87 },
    ],
    ST: [
      { name: 'Erling Haaland', club: 'Manchester City', rating: 91 },
      { name: 'Kylian Mbappé', club: 'Real Madrid', rating: 91 },
      { name: 'Robert Lewandowski', club: 'Barcelona', rating: 88 },
      { name: 'Harry Kane', club: 'Bayern Munich', rating: 90 },
    ],
    LW: [
      { name: 'Vinícius Júnior', club: 'Real Madrid', rating: 90 },
      { name: 'Rafael Leão', club: 'AC Milan', rating: 86 },
      { name: 'Khvicha Kvaratskhelia', club: 'Napoli', rating: 85 },
      { name: 'Gabriel Martinelli', club: 'Arsenal', rating: 85 },
    ],
  };

  // 2. Mix Pool (Famous Stars + High-Quality Underrated Gems)
  const mixTierPool: Record<string, Array<{ name: string; club: string; rating: number }>> = {
    GK: [
      { name: 'Mike Maignan', club: 'AC Milan', rating: 87 },
      { name: 'Unai Simón', club: 'Athletic Bilbao', rating: 85 },
      { name: 'David Raya', club: 'Arsenal', rating: 84 },
      { name: 'Emiliano Martínez', club: 'Aston Villa', rating: 86 },
    ],
    RB: [
      { name: 'Jeremie Frimpong', club: 'Bayer Leverkusen', rating: 85 },
      { name: 'Jules Koundé', club: 'Barcelona', rating: 85 },
      { name: 'Ben White', club: 'Arsenal', rating: 84 },
      { name: 'Pedro Porro', club: 'Tottenham', rating: 83 },
    ],
    CB: [
      { name: 'Alessandro Bastoni', club: 'Inter Milan', rating: 87 },
      { name: 'Gabriel Magalhães', club: 'Arsenal', rating: 86 },
      { name: 'Gleison Bremer', club: 'Juventus', rating: 85 },
      { name: 'Nico Schlotterbeck', club: 'Borussia Dortmund', rating: 84 },
    ],
    LB: [
      { name: 'Alejandro Grimaldo', club: 'Bayer Leverkusen', rating: 86 },
      { name: 'Destiny Udogie', club: 'Tottenham', rating: 83 },
      { name: 'Nuno Mendes', club: 'PSG', rating: 84 },
      { name: 'Ferland Mendy', club: 'Real Madrid', rating: 84 },
    ],
    CDM: [
      { name: 'Bruno Guimarães', club: 'Newcastle', rating: 86 },
      { name: 'João Palhinha', club: 'Bayern Munich', rating: 85 },
      { name: 'Manuel Locatelli', club: 'Juventus', rating: 83 },
      { name: 'Éderson', club: 'Atalanta', rating: 83 },
    ],
    CM: [
      { name: 'Nicolò Barella', club: 'Inter Milan', rating: 87 },
      { name: 'Alexis Mac Allister', club: 'Liverpool', rating: 85 },
      { name: 'Dani Olmo', club: 'Barcelona', rating: 85 },
      { name: 'Tijjani Reijnders', club: 'AC Milan', rating: 83 },
    ],
    RW: [
      { name: 'Nico Williams', club: 'Athletic Bilbao', rating: 86 },
      { name: 'Takefusa Kubo', club: 'Real Sociedad', rating: 84 },
      { name: 'Jarrod Bowen', club: 'West Ham', rating: 83 },
      { name: 'Matheus Cunha', club: 'Wolves', rating: 83 },
    ],
    ST: [
      { name: 'Ollie Watkins', club: 'Aston Villa', rating: 86 },
      { name: 'Alexander Isak', club: 'Newcastle', rating: 86 },
      { name: 'Lautaro Martínez', club: 'Inter Milan', rating: 88 },
      { name: 'Viktor Gyökeres', club: 'Sporting CP', rating: 85 },
    ],
    LW: [
      { name: 'Son Heung-min', club: 'Tottenham', rating: 87 },
      { name: 'Anthony Gordon', club: 'Newcastle', rating: 84 },
      { name: 'Ademola Lookman', club: 'Atalanta', rating: 85 },
      { name: 'Mikel Oyarzabal', club: 'Real Sociedad', rating: 84 },
    ],
  };

  // 3. Underrated & Less Media Hype Solid League Players (normal_tier)
  const normalTierPool: Record<string, Array<{ name: string; club: string; rating: number }>> = {
    GK: [
      { name: 'Guglielmo Vicario', club: 'Tottenham', rating: 83 },
      { name: 'Alex Remiro', club: 'Real Sociedad', rating: 83 },
      { name: 'Bernd Leno', club: 'Fulham', rating: 82 },
      { name: 'Lukáš Hrádecký', club: 'Bayer Leverkusen', rating: 83 },
    ],
    RB: [
      { name: 'Timothy Castagne', club: 'Fulham', rating: 80 },
      { name: 'Stefan Posch', club: 'Bologna', rating: 80 },
      { name: 'Diogo Dalot', club: 'Manchester United', rating: 82 },
      { name: 'Hamari Traoré', club: 'Real Sociedad', rating: 80 },
    ],
    CB: [
      { name: 'Lewis Dunk', club: 'Brighton', rating: 81 },
      { name: 'Pau Torres', club: 'Aston Villa', rating: 83 },
      { name: 'Max Kilman', club: 'West Ham', rating: 80 },
      { name: 'Robin Le Normand', club: 'Atletico Madrid', rating: 82 },
    ],
    LB: [
      { name: 'Antonee Robinson', club: 'Fulham', rating: 81 },
      { name: 'Pervis Estupiñán', club: 'Brighton', rating: 81 },
      { name: 'Caio Henrique', club: 'Monaco', rating: 80 },
      { name: 'Maximilian Mittelstädt', club: 'Stuttgart', rating: 81 },
    ],
    CDM: [
      { name: 'Bryan Cristante', club: 'AS Roma', rating: 81 },
      { name: 'Christian Nørgaard', club: 'Brentford', rating: 80 },
      { name: 'Marten de Roon', club: 'Atalanta', rating: 80 },
      { name: 'Youssouf Fofana', club: 'AC Milan', rating: 82 },
    ],
    CM: [
      { name: 'James Ward-Prowse', club: 'West Ham', rating: 81 },
      { name: 'Lucas Paquetá', club: 'West Ham', rating: 83 },
      { name: 'Pascal Groß', club: 'Borussia Dortmund', rating: 82 },
      { name: 'Enzo Le Fée', club: 'AS Roma', rating: 79 },
    ],
    RW: [
      { name: 'Bryan Mbeumo', club: 'Brentford', rating: 82 },
      { name: 'Pedro Neto', club: 'Chelsea', rating: 82 },
      { name: 'Viktor Tsygankov', club: 'Girona', rating: 81 },
      { name: 'Albert Guðmundsson', club: 'Fiorentina', rating: 81 },
    ],
    ST: [
      { name: 'Rodrigo Muniz', club: 'Fulham', rating: 79 },
      { name: 'Dominic Solanke', club: 'Tottenham', rating: 82 },
      { name: 'Artem Dovbyk', club: 'AS Roma', rating: 83 },
      { name: 'Serhou Guirassy', club: 'Borussia Dortmund', rating: 83 },
    ],
    LW: [
      { name: 'Alex Baena', club: 'Villarreal', rating: 82 },
      { name: 'Dwight McNeil', club: 'Everton', rating: 79 },
      { name: 'Vincenzo Grifo', club: 'Freiburg', rating: 81 },
      { name: 'Mattia Zaccagni', club: 'Lazio', rating: 82 },
    ],
  };

  const pool =
    theme === 'normal_tier'
      ? normalTierPool
      : theme === 'mix_tier'
      ? mixTierPool
      : topTierPool;

  return POSITIONS_433.map((pos, index) => {
    const candidates = pool[pos] || [
      { name: `Real Player A (${pos})`, club: 'Club Alpha', rating: 82 },
      { name: `Real Player B (${pos})`, club: 'Club Beta', rating: 80 },
    ];

    const pA = candidates[0];
    const pB = candidates[1];

    const priceA = Math.floor(basePricePerPlayer * (1 + (pA.rating - 82) * 0.05));
    const priceB = Math.floor(basePricePerPlayer * (1 + (pB.rating - 82) * 0.05));

    return {
      round: index + 1,
      position: pos,
      playerA: {
        id: `p1-r${index}`,
        name: pA.name,
        club: pA.club,
        rating: pA.rating,
        price: Math.max(1000, priceA),
        position: pos,
      },
      playerB: {
        id: `p2-r${index}`,
        name: pB.name,
        club: pB.club,
        rating: pB.rating,
        price: Math.max(800, priceB),
        position: pos,
      },
    };
  });
}
