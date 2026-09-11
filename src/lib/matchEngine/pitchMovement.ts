/**
 * Pitch Movement Engine — Football Manager Style
 * ===============================================
 * Calculates dynamic 2D coordinates for 22 players on the pitch.
 * Incorporates:
 * - Formation base slots
 * - Team Tactics: defensiveLine (high/deep), mentality (attacking/defensive),
 *   attackingFocus (left/center/right/mixed), pressing (high/low), counterAttack
 * - Lateral team unit shifting following the ball (compactness)
 * - Active ball carrier & receiver tracking
 * - Goalkeeper diving & anticipating shots
 * - Boundary clamping & micro-sway for alive pitch feel
 */

import { FormationSlot, TacticalSetup, MatchEvent, FootballPlayer } from '@/types/game';

export interface CalculatedPlayerPosition {
  svgX: number;
  svgY: number;
  isBallCarrier: boolean;
  isActionLeader: boolean;
}

interface CalculatePositionOpts {
  slot: FormationSlot;
  slotIndex: number;
  isHome: boolean;
  player?: FootballPlayer;
  currentEvent: MatchEvent;
  homeTactics: TacticalSetup;
  awayTactics: TacticalSetup;
  ballPosition: { x: number; y: number };
  eventIndex: number;
}

/**
 * Computes the precise SVG (600x400) position for a player on the pitch.
 */
export function calculatePlayerPosition({
  slot,
  slotIndex,
  isHome,
  player,
  currentEvent,
  homeTactics,
  awayTactics,
  ballPosition,
  eventIndex,
}: CalculatePositionOpts): CalculatedPlayerPosition {
  const tactics = isHome ? homeTactics : awayTactics;
  const isThisTeamAttacking = currentEvent.team === (isHome ? 'home' : 'away');
  const isThisTeamDefending = currentEvent.team === (isHome ? 'away' : 'home');

  // Forward direction in SVG Y:
  // Home attacks UPWARD (decreasing Y, from 380 to 20)
  // Away attacks DOWNWARD (increasing Y, from 20 to 380)
  const forwardDir = isHome ? -1 : 1;

  // 1. BASE COORDINATES
  // Home: slot.y 0 (GK) -> 380, slot.y 100 (ST) -> 200
  // Away: slot.y 0 (GK) -> 20, slot.y 100 (ST) -> 200
  let baseY = isHome
    ? 380 - (slot.y / 100) * 180
    : 20 + ((100 - slot.y) / 100) * 180;
  let baseX = 30 + (slot.x / 100) * 540;

  let dx = 0;
  let dy = 0;
  let isBallCarrier = false;
  let isActionLeader = false;

  // 2. TACTICAL DEFENSIVE LINE
  if (tactics.defensiveLine === 'high') {
    if (slot.role === 'defender') dy += forwardDir * 26;
    else if (slot.role === 'midfielder') dy += forwardDir * 18;
    else if (slot.role === 'attacker') dy += forwardDir * 12;
    else if (slot.role === 'goalkeeper') dy += forwardDir * 14; // Sweeper keeper steps out
  } else if (tactics.defensiveLine === 'deep') {
    if (slot.role === 'defender') dy -= forwardDir * 20;
    else if (slot.role === 'midfielder') dy -= forwardDir * 14;
    else if (slot.role === 'attacker') dy -= forwardDir * 8;
  }

  // 3. TACTICAL MENTALITY
  if (tactics.mentality === 'attacking') {
    if (slot.role === 'attacker') dy += forwardDir * 22;
    else if (slot.role === 'midfielder') dy += forwardDir * 16;
    else if (slot.role === 'defender') {
      // Fullbacks push up aggressively
      const isFullback = slot.x < 30 || slot.x > 70;
      dy += forwardDir * (isFullback ? 25 : 12);
    }
  } else if (tactics.mentality === 'defensive') {
    if (slot.role === 'attacker') dy -= forwardDir * 14;
    else if (slot.role === 'midfielder') dy -= forwardDir * 20;
    else if (slot.role === 'defender') dy -= forwardDir * 16;
  }

  // 4. TACTICAL ATTACKING FOCUS
  const distFromCenter = slot.x - 50;
  const isWidePlayer = Math.abs(distFromCenter) > 18;
  if (tactics.attackingFocus === 'left') {
    // Whole attacking shape leans left
    dx -= 16;
    if (slot.x < 40) dy += forwardDir * 8;
  } else if (tactics.attackingFocus === 'right') {
    // Whole attacking shape leans right
    dx += 16;
    if (slot.x > 60) dy += forwardDir * 8;
  } else if (tactics.attackingFocus === 'center') {
    // Wingers tuck inside towards half spaces
    if (isWidePlayer) {
      dx -= Math.sign(distFromCenter) * 16;
    }
  }

  // 5. TEAM UNIT LATERAL SHIFT (Follow ball side for compactness)
  // When ball is on the right wing, whole team shifts right; when on left, whole team shifts left.
  const ballLateralShift = (ballPosition.x - 50) / 50; // -1.0 to 1.0
  dx += ballLateralShift * 18;

  // 6. EVENT-DRIVEN MOVEMENT
  const ballSVGX = 30 + (ballPosition.x / 100) * 540;
  const ballSVGY = 20 + (ballPosition.y / 100) * 360;

  if (isThisTeamAttacking) {
    switch (currentEvent.type) {
      case 'attack':
      case 'dangerousAttack':
      case 'chanceCreation': {
        if (slot.role === 'attacker') {
          dy += forwardDir * 32;
          // Pull striker towards goal mouth
          dx += (300 - (baseX + dx)) * 0.2;
          isActionLeader = true;
        } else if (slot.role === 'midfielder') {
          dy += forwardDir * 20;
        } else if (slot.role === 'defender') {
          dy += forwardDir * 10;
        }
        break;
      }

      case 'counterAttack': {
        const extraSpeed = tactics.counterAttack ? 1.35 : 1.0;
        if (slot.role === 'attacker') {
          dy += forwardDir * (42 * extraSpeed);
          dx += (ballSVGX - (baseX + dx)) * 0.35;
          isActionLeader = true;
        } else if (slot.role === 'midfielder') {
          dy += forwardDir * (25 * extraSpeed);
        }
        break;
      }

      case 'shot':
      case 'shotOnTarget':
      case 'shotOffTarget':
      case 'blockedShot':
      case 'goal': {
        if (slot.role === 'attacker') {
          // Primary striker converges directly onto ball
          dy += forwardDir * 38;
          dx += (ballSVGX - (baseX + dx)) * 0.55;
          isBallCarrier = true;
        } else if (slot.role === 'midfielder') {
          dy += forwardDir * 24;
        }
        break;
      }

      case 'corner': {
        // Corner taker is wide near corner
        if (slot.role === 'attacker' || (slot.role === 'midfielder' && isWidePlayer)) {
          if (slotIndex % 2 === 0) {
            // Corner taker
            return {
              svgX: ballSVGX + (isHome ? 2 : -2),
              svgY: ballSVGY + (isHome ? 2 : -2),
              isBallCarrier: true,
              isActionLeader: true,
            };
          }
        }
        // Tall defenders and other attackers pack opponent box
        if (slot.role === 'attacker' || slot.role === 'defender') {
          dy += forwardDir * 45;
          dx += (300 - (baseX + dx)) * 0.4;
        }
        break;
      }

      case 'possession':
      case 'buildUp': {
        if (slot.role === 'midfielder') {
          dx += (ballSVGX - (baseX + dx)) * 0.25;
          dy += forwardDir * 12;
        }
        break;
      }

      default:
        break;
    }
  }

  if (isThisTeamDefending) {
    switch (currentEvent.type) {
      case 'attack':
      case 'dangerousAttack':
      case 'counterAttack': {
        if (slot.role === 'defender') {
          dy -= forwardDir * 16;
          // Defenders compress toward central goal area
          dx += (300 - (baseX + dx)) * 0.25;
        } else if (slot.role === 'midfielder') {
          if (tactics.pressing === 'high') {
            // High pressing: midfielders step up and swarm toward ball
            const toBallX = (ballSVGX - (baseX + dx)) * 0.4;
            const toBallY = (ballSVGY - (baseY + dy)) * 0.4;
            dx += toBallX;
            dy += toBallY;
          } else {
            dy -= forwardDir * 18;
          }
        }
        break;
      }

      case 'shot':
      case 'shotOnTarget':
      case 'save':
      case 'goal': {
        // Goalkeeper reaction dive
        if (slot.role === 'goalkeeper') {
          const diveDirection = (ballPosition.x - 50) * 1.8;
          dx += diveDirection;
          dy += forwardDir * (currentEvent.type === 'save' ? 12 : 6);
          isActionLeader = true;
        } else if (slot.role === 'defender') {
          // Defenders collapse in front of goal
          dx += (300 - (baseX + dx)) * 0.4;
          dy -= forwardDir * 12;
        }
        break;
      }

      case 'tackle':
      case 'interception': {
        if (slot.role === 'defender' || slot.role === 'midfielder') {
          // Tackler closes down onto ball
          dx += (ballSVGX - (baseX + dx)) * 0.5;
          dy += (ballSVGY - (baseY + dy)) * 0.5;
          isActionLeader = true;
        }
        break;
      }

      default:
        break;
    }
  }

  // 7. ORGANIC MICRO-SWAY (Alive pitch feel)
  const swayX = Math.sin(eventIndex * 1.8 + slot.x) * 3;
  const swayY = Math.cos(eventIndex * 1.8 + slot.y) * 2;
  dx += swayX;
  dy += swayY;

  // 8. FINAL COORDINATES & BOUNDARY CLAMPING
  let finalX = baseX + dx;
  let finalY = baseY + dy;

  // Clamp inside pitch lines (x: 40-560, y: 25-375)
  finalX = Math.max(40, Math.min(560, finalX));
  finalY = Math.max(25, Math.min(375, finalY));

  return {
    svgX: finalX,
    svgY: finalY,
    isBallCarrier,
    isActionLeader,
  };
}
