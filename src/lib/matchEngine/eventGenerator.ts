/**
 * Event Generator
 * ================
 * Generates match events with natural Indonesian commentary.
 * Uses weighted templates and player references for realistic narration.
 */

import { MatchEvent, MatchEventType, FootballPlayer } from '@/types/game';

/** Simple counter for generating unique event IDs */
let eventCounter = 0;
export function resetEventCounter() { eventCounter = 0; }

function nextEventId(): string {
  return `evt_${++eventCounter}`;
}

/**
 * Commentary template pools — varied templates for each event type.
 * {attacker}, {defender}, {gk}, {team}, {opponent} are replaced with actual names.
 */
const COMMENTARY_TEMPLATES: Record<string, string[]> = {
  kickoff: [
    '🔥 Peluit pertama berbunyi! Pertandingan antara {home} vs {away} resmi dimulai!',
    '⚽ Kick-off! {home} melawan {away} — siapa yang akan menjadi pemenang?',
    '🏟️ Pertandingan dimulai! Atmosfer stadion sangat meriah untuk laga {home} vs {away}!',
  ],
  halftime: [
    '⏱️ Peluit babak pertama! Skor sementara {home} {hs} - {as} {away}.',
    '🔔 Babak pertama selesai. {home} {hs} - {as} {away}. Kedua tim menuju ruang ganti.',
    '⏸️ Turun minum! {home} {hs} vs {away} {as}. Babak kedua akan segera dimulai.',
  ],
  secondHalfStart: [
    '🔔 Babak kedua dimulai! Kedua tim kembali ke lapangan.',
    '⚽ Kick-off babak kedua! Pertandingan dilanjutkan.',
    '🏟️ Babak kedua dimulai. Siapa yang akan mendominasi 45 menit terakhir?',
  ],
  fulltime: [
    '🎺 Peluit panjang! 90 menit pertandingan reguler selesai! {home} {hs} - {as} {away}.',
    '🏁 Full time babak kedua! Skor akhir 90 menit: {home} {hs} - {as} {away}.',
    '⏱️ Pertandingan 90 menit berakhir! {home} {hs} vs {away} {as}.',
  ],
  extraTimeFirstHalfStart: [
    '⏳ SKOR IMBANG! Pertandingan berlanjut ke EXTRA TIME (Babak Tambahan 2 x 15 menit)! Kick-off babak tambahan pertama!',
    '🔥 Ketegangan berlanjut! Extra Time Babak 1 dimulai! Kedua tim harus berjuang keras di 30 menit tambahan ini!',
    '⏱️ Peluit ditiup wasit! Babak tambahan pertama (Extra Time) dimulai!',
  ],
  extraTimeHalftime: [
    '⏸️ Jeda Extra Time! Babak tambahan pertama selesai. Skor masih {hs} - {as}. Kedua tim bertukar sisi!',
    '⏱️ Selesai babak tambahan pertama! Hanya ada jeda singkat sebelum 15 menit terakhir.',
  ],
  extraTimeSecondHalfStart: [
    '⏳ 15 menit terakhir Extra Time dimulai! Akankah ada gol penentu kemenangan sebelum adu penalti?',
    '🔥 Kick-off babak tambahan kedua! Siapa yang mampu memecah kebuntuan?',
  ],
  extraTimeFulltime: [
    '⌛ 120 menit tuntas dan skor masih imbang {hs} - {as}! Pemenang harus ditentukan melalui ADU PENALTI!',
    '🎺 Peluit akhir Extra Time berbunyi! 120 menit berakhir imbang {hs} - {as}. Siapkan mental untuk adu penalti!',
  ],
  penaltyShootoutStart: [
    '🎯 DRAMA ADU PENALTI DIMULAI! Algojo penendang dan penjaga gawang kedua tim bersiap di titik putih!',
    '💥 Babak adu penalti resmi dibuka! Pertarungan mental dan akurasi yang sesungguhnya!',
  ],
  penaltyKickGoal: [
    '⚽ [PENALTI GOL!] Eksekusi dingin dari {player}! Bola bersarang mulus ke dalam gawang!',
    '⚽ [PENALTI GOL!] Tembakan keras tak terbendung dari {player}! Kiper salah menebak arah!',
    '⚽ [PENALTI GOL!] Sangat tenang! {player} mengelabui {gk} dan mencetak gol penalti!',
    '⚽ [PENALTI GOL!] Sepakan sempurna dari {player}! Mengarah tepat ke sudut gawang!',
  ],
  penaltyKickSave: [
    '🧤 [PENALTI DITELEPIS!] {gk} melakukan penyelamatan fantastis menepis tendangan {player}!',
    '🧤 [PENALTI GAGAL!] Tembakan {player} terbaca sempurna oleh {gk}! Penyelamatan heroik!',
    '🧤 [PENALTI DIGAGALKAN!] {gk} melompat ke arah yang tepat dan menepis bola {player}!',
  ],
  penaltyKickMiss: [
    '💨 [PENALTI MELENCENG!] Tendangan {player} melebar dari tiang gawang! Tekanan yang amat berat!',
    '😤 [PENALTI MELAMBUNG!] Tembakan {player} melayang di atas mistar! Peluang emas terbuang!',
  ],
  penaltyShootoutEnd: [
    '🏆 ADU PENALTI SELESAI! {team} keluar sebagai PEMENANG dramatis pertandingan ini!',
    '🎉 KEMENANGAN DRAMATIS! {team} sukses mengunci kemenangan lewat drama adu penalti!',
  ],
  possession: [
    '{team} menguasai bola di area tengah lapangan.',
    '{team} membangun permainan dengan sabar dari belakang.',
    '{player} mengontrol bola dan mencari celah di pertahanan {opponent}.',
    'Rotasi bola oleh {team} di lini tengah. {player} memegang kendali.',
    '{player} menggiring bola di tengah lapangan, mencari peluang.',
  ],
  buildUp: [
    '{team} mulai membangun serangan dari lini tengah.',
    '{player} mengirim umpan ke depan, memulai fase serangan {team}.',
    'Build-up yang rapi dari {team}. {player} melepaskan umpan ke ruang terbuka.',
    '{team} menggerakkan bola dengan cepat ke sepertiga lapangan lawan.',
    '{player} menerima bola dan mulai mengorganisir serangan {team}.',
  ],
  pass: [
    'Umpan cantik dari {player} menembus lini pertahanan {opponent}.',
    '{player} mengirim umpan terobosan yang brilian!',
    'Kombinasi one-two antara pemain {team}. Umpan dari {player}!',
  ],
  attack: [
    '{team} melancarkan serangan melalui sisi {side}!',
    'Serangan berbahaya dari {team}! {player} membawa bola ke kotak penalti!',
    '{player} memimpin serangan {team}. Pertahanan {opponent} tertekan!',
    '{team} menekan ke depan dengan intensitas tinggi!',
  ],
  counterAttack: [
    '⚡ Serangan balik kilat dari {team}! {player} berlari menembus pertahanan {opponent}!',
    '🔄 Counter attack! {team} memanfaatkan ruang kosong di belakang pertahanan {opponent}!',
    '⚡ Transisi cepat! {player} memimpin serangan balik {team} dengan kecepatan tinggi!',
    '🔄 {team} melancarkan counter attack berbahaya! {player} berlari ke kotak penalti!',
  ],
  dangerousAttack: [
    '⚠️ Serangan berbahaya dari {team}! {player} berada dalam posisi mengancam!',
    '🔥 {team} menciptakan peluang emas! {player} di depan gawang {opponent}!',
    '⚠️ Tekanan besar dari {team}! Pertahanan {opponent} hampir kebobolan!',
  ],
  chanceCreation: [
    '{player} menciptakan peluang untuk {team}!',
    'Umpan silang tajam dari {player}! Peluang terbuka untuk {team}!',
    '{player} berhasil melewati bek dan menciptakan peluang!',
  ],
  shotOnTarget: [
    '🎯 TEMBAKAN! {player} melepaskan tembakan keras ke arah gawang!',
    '💥 {player} menembak! Bola mengarah tepat ke gawang {opponent}!',
    '🎯 Shot on target dari {player}! Tembakan terarah ke gawang!',
  ],
  shotOffTarget: [
    '💨 {player} melepaskan tembakan tapi melebar ke sisi kanan gawang!',
    '😤 Tembakan dari {player} melayang di atas mistar gawang!',
    '💨 {player} menembak tapi sayang bola masih tidak tepat sasaran.',
    '😤 Peluang terbuang! Tembakan {player} melenceng jauh dari gawang.',
  ],
  blockedShot: [
    '🛡️ Tembakan {player} diblok oleh {defender}! Pertahanan solid!',
    '🚫 {defender} memblok tembakan dari {player}! Penyelamatan penting!',
    '🛡️ Tembakan keras dari {player} tapi {defender} berdiri di posisi yang tepat untuk membloknya!',
  ],
  save: [
    '🧤 SAVE! {gk} menyelamatkan gawang dengan penyelamatan gemilang!',
    '🧤 Penyelamatan fantastis dari {gk}! Tembakan {player} berhasil ditepis!',
    '🧤 {gk} terbang menggapai bola! Penyelamatan kelas dunia!',
    '🧤 Reflek luar biasa dari {gk}! Bola ditepis ke sepak pojok!',
  ],
  goal: [
    '⚽ GOOOOOLL!!! {player} mencetak gol untuk {team}! Skor menjadi {hs}-{as}!',
    '⚽ GOLLL!!! Tembakan sempurna dari {player}! {team} unggul! {hs}-{as}!',
    '⚽ GOLAZO!!! {player} merobek gawang {opponent}! Penonton meledak! {hs}-{as}!',
    '⚽ GOOL INDAH! {player} menyelesaikan serangan {team} dengan brilian! {hs}-{as}!',
    '⚽ GOOOLL!!! {player} tidak terbendung! Gawang {opponent} bergetar! {hs}-{as}!',
  ],
  corner: [
    '🚩 Sepak pojok untuk {team}. {player} bersiap mengeksekusi.',
    '🚩 Corner kick! {team} mendapat kesempatan dari sepak pojok.',
    '🚩 Sepak pojok untuk {team}. Pemain-pemain tinggi bergerak ke kotak penalti.',
  ],
  freeKick: [
    '📐 Tendangan bebas untuk {team} di posisi berbahaya!',
    '📐 Free kick! {player} bersiap mengeksekusi untuk {team}.',
    '📐 {team} mendapat tendangan bebas. {player} berdiri di belakang bola.',
  ],
  offside: [
    '🚩 Offside! {player} berada di posisi terlarang. Serangan {team} dibatalkan.',
    '🚩 Bendera asisten wasit terangkat! {player} dari {team} offside.',
    '🚩 Offside! {player} terjebak perangkap offside {opponent}.',
  ],
  interception: [
    '🔄 {player} merebut bola! Serangan {opponent} terhenti!',
    '🔄 Intersepsi cerdas dari {player}! {team} merebut penguasaan bola.',
    '🔄 {player} membaca permainan dengan baik dan merebut bola dari {opponent}.',
  ],
  tackle: [
    '💪 Tekel bersih dari {player}! Bola berhasil direbut dari pemain {opponent}.',
    '💪 {player} melakukan sliding tackle sempurna! Serangan {opponent} digagalkan!',
    '💪 Tekel krusial oleh {player}! Peluang {opponent} berhasil dipatahkan.',
  ],
  foul: [
    '⚖️ Pelanggaran oleh {player}. Tendangan bebas untuk {opponent}.',
    '⚖️ {player} melakukan pelanggaran taktis. Wasit meniup peluit.',
    '⚖️ Pelanggaran di tengah lapangan oleh {player}. Permainan dihentikan.',
  ],
};

interface CreateEventOpts {
  minute: number;
  injuryTime?: boolean;
  type: MatchEventType;
  team: 'home' | 'away' | 'neutral';
  homeScore: number;
  awayScore: number;
  momentum: number;
  homeTeamName: string;
  awayTeamName: string;
  involvedPlayers?: string[];
  scorer?: string;
  assister?: string;
  attackerName?: string;
  defenderName?: string;
  gkName?: string;
  side?: string;
  period?: 'firstHalf' | 'secondHalf' | 'extraTimeFirst' | 'extraTimeSecond' | 'penalties';
  penaltyTaker?: string;
  penaltyOutcome?: 'goal' | 'save' | 'miss';
  penaltyRound?: number;
  homePenalties?: number;
  awayPenalties?: number;
  rng: () => number;
}

/**
 * Create a match event with auto-generated commentary.
 */
export function createMatchEvent(opts: CreateEventOpts): MatchEvent {
  const {
    minute, injuryTime = false, type, team, homeScore, awayScore, momentum,
    homeTeamName, awayTeamName, involvedPlayers = [], scorer, assister,
    attackerName, defenderName, gkName, side, period,
    penaltyTaker, penaltyOutcome, penaltyRound, homePenalties, awayPenalties, rng
  } = opts;

  const teamName = team === 'home' ? homeTeamName : team === 'away' ? awayTeamName : '';
  const opponentName = team === 'home' ? awayTeamName : team === 'away' ? homeTeamName : '';
  const playerName = penaltyTaker || attackerName || involvedPlayers[0] || 'Pemain';

  // Select commentary template
  let templateKey: string = type === 'shot' ? 'shotOnTarget' : type;
  if (type === 'penaltyKick') {
    if (penaltyOutcome === 'save') templateKey = 'penaltyKickSave';
    else if (penaltyOutcome === 'miss') templateKey = 'penaltyKickMiss';
    else templateKey = 'penaltyKickGoal';
  }

  const templates = COMMENTARY_TEMPLATES[templateKey] || COMMENTARY_TEMPLATES.possession;
  const template = templates[Math.floor(rng() * templates.length)];

  // Fill template
  const commentary = template
    .replace(/\{team\}/g, teamName)
    .replace(/\{opponent\}/g, opponentName)
    .replace(/\{player\}/g, playerName)
    .replace(/\{attacker\}/g, attackerName || playerName)
    .replace(/\{defender\}/g, defenderName || 'Bek')
    .replace(/\{gk\}/g, gkName || 'Kiper')
    .replace(/\{home\}/g, homeTeamName)
    .replace(/\{away\}/g, awayTeamName)
    .replace(/\{hs\}/g, String(homeScore))
    .replace(/\{as\}/g, String(awayScore))
    .replace(/\{hs_pen\}/g, String(homePenalties ?? 0))
    .replace(/\{as_pen\}/g, String(awayPenalties ?? 0))
    .replace(/\{side\}/g, side || 'tengah');

  return {
    id: nextEventId(),
    minute,
    injuryTime,
    type,
    team,
    commentary,
    involvedPlayers,
    scorer,
    assister,
    homeScore,
    awayScore,
    momentum,
    period,
    penaltyTaker,
    penaltyOutcome,
    penaltyRound,
    homePenalties,
    awayPenalties,
  };
}

/**
 * Get a random player from a squad by role preference.
 */
export function getRandomPlayerByRole(
  squad: FootballPlayer[],
  slotPositions: Map<string, string>,
  preferredRoles: string[],
  rng: () => number
): FootballPlayer {
  // Try to find a player matching preferred roles
  const candidates = squad.filter(p => {
    const slotPos = slotPositions.get(p.id);
    return slotPos && preferredRoles.some(role => {
      if (role === 'attacker') return ['ST', 'CF', 'LW', 'RW'].includes(slotPos);
      if (role === 'midfielder') return ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(slotPos);
      if (role === 'defender') return ['CB', 'LB', 'RB'].includes(slotPos);
      if (role === 'goalkeeper') return slotPos === 'GK';
      return false;
    });
  });

  if (candidates.length > 0) {
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // Fallback: random player from squad
  return squad[Math.floor(rng() * squad.length)];
}

/**
 * Get the goalkeeper from a squad.
 */
export function getGoalkeeper(
  squad: FootballPlayer[],
  slotPositions: Map<string, string>
): FootballPlayer | undefined {
  return squad.find(p => slotPositions.get(p.id) === 'GK') || squad.find(p => p.position === 'GK');
}

/**
 * Get a random attacking side for commentary.
 */
export function getRandomSide(rng: () => number): string {
  const sides = ['kiri', 'kanan', 'tengah'];
  return sides[Math.floor(rng() * sides.length)];
}
