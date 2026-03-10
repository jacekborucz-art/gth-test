import { Club, Player, Lineup, HealthStatus, InjurySeverity } from '../types';
import { TacticRepository } from '../resources/tactics_db';

/**
 * Raport zwiadowczy AI — co trener AI MYŚLI o drużynie gracza przed meczem.
 * Dokładność zależy od atrybutu `experience` trenera (Option B: progresywny z podłogą).
 *
 * Skala błędów:
 *   exp=99 → 1-5%   | exp=70 → 8-15%
 *   exp=50 → 18-28% | exp=30 → 30-42%
 *   exp=1  → 38-50%
 */
export interface AiScoutReport {
  /** Szacowana siła drużyny gracza (rzeczywista ± błąd%) */
  perceivedPower: number;
  /** Rozpoznana taktyka gracza — może być błędna przy niskim experience */
  perceivedTacticId: string;
  /** Szacowana liczba kontuzjowanych/zawieszonych graczy w kadrze gracza */
  perceivedInjuredCount: number;
  /** Szacowany poziom świeżości fizycznej drużyny gracza */
  perceivedFatigueLevel: 'FRESH' | 'TIRED' | 'EXHAUSTED';
  /** Czy trener AI myśli, że drużyna gracza jest osłabiona (kontuzje/zawieszenia) */
  isPerceivedWeakened: boolean;
  /** Dokładność wywiadu: 0.0 (zupełnie błędny) → 1.0 (perfekcyjny) */
  scoutingAccuracy: number;
  /** Rzeczywisty procent błędu zastosowany do raportu */
  errorMargin: number;
}

export const AiScoutingService = {
  /**
   * Generuje raport zwiadowczy trenera AI na podstawie danych drużyny gracza.
   * Im wyższe `coachExperience`, tym precyzyjniejszy raport.
   */
  generateReport: (
    _playerClub: Club,
    playerPlayers: Player[],
    playerLineup: Lineup,
    coachExperience: number
  ): AiScoutReport => {
    const exp = Math.max(1, Math.min(99, coachExperience));

    // --- BŁĄD SKAUTA (Option B: progresywny z podłogą) ---
    // Segment górny (exp 70-99): małe, precyzyjne błędy
    // Segment dolny (exp 1-70): duże, rosnące błędy
    const minError = exp >= 70
      ? Math.max(1, 1 + (99 - exp) * 0.241)  // 1-8% dla exp 70-99
      : Math.max(1, 8 + (70 - exp) * 0.435); // 8-38% dla exp 1-70

    const range = exp >= 70
      ? 4 + (99 - exp) * 0.10                // zakres 4-7% w górnym segmencie
      : Math.min(12, 7 + (70 - exp) * 0.125); // zakres 7-12% w dolnym segmencie

    const errorMargin = minError + Math.random() * range;
    const scoutingAccuracy = Math.max(0, Math.min(1, 1 - errorMargin / 100));

    // --- DANE REALNE DRUŻYNY GRACZA ---
    const starters = playerLineup.startingXI.filter(Boolean) as string[];
    const starterPlayers = starters
      .map(id => playerPlayers.find(p => p.id === id))
      .filter((p): p is Player => !!p);

    const injuredOrSuspended = playerPlayers.filter(p =>
      p.health.status === HealthStatus.INJURED ||
      p.health.injury?.severity === InjurySeverity.SEVERE ||
      p.suspensionMatches > 0
    );

    const avgCondition = starterPlayers.length > 0
      ? starterPlayers.reduce((sum, p) => sum + p.condition, 0) / starterPlayers.length
      : 80;

    // Siła drużyny: suma (atakowanie + podania + obrona) każdego startującego gracza
    const realPower = starterPlayers.reduce(
      (sum, p) => sum + (p.attributes.attacking + p.attributes.passing + p.attributes.defending), 0
    );

    const realInjuredCount = injuredOrSuspended.length;
    const realWeakened = realInjuredCount >= 3 || starterPlayers.length < 10;

    // --- ZABURZENIE SIŁY (błąd kierunkowy) ---
    const powerErrorDir = Math.random() > 0.5 ? 1 : -1;
    const perceivedPower = Math.max(1, realPower * (1 + powerErrorDir * errorMargin / 100));

    // --- ROZPOZNANIE TAKTYKI ---
    let perceivedTacticId = playerLineup.tacticId;
    if (scoutingAccuracy < 0.75 && Math.random() > scoutingAccuracy) {
      // Trener z niskim exp może błędnie zidentyfikować taktykę rywala
      const allTactics = TacticRepository.getAll();
      const wrongTactics = allTactics.filter(t => t.id !== playerLineup.tacticId);
      if (wrongTactics.length > 0) {
        perceivedTacticId = wrongTactics[Math.floor(Math.random() * wrongTactics.length)].id;
      }
    }

    // --- OCENA ŚWIEŻOŚCI ---
    // Błąd kondycji: ±(errorMargin * 0.5) punktów kondycji
    const conditionError = (Math.random() * 2 - 1) * (errorMargin * 0.5);
    const perceivedCondition = Math.max(50, Math.min(100, avgCondition + conditionError));
    const perceivedFatigueLevel: 'FRESH' | 'TIRED' | 'EXHAUSTED' =
      perceivedCondition >= 82 ? 'FRESH' :
      perceivedCondition >= 67 ? 'TIRED' : 'EXHAUSTED';

    // --- OCENA OSŁABIENIA ---
    let isPerceivedWeakened = realWeakened;
    // Trener z bardzo niską dokładnością może się mylić w obie strony
    if (Math.random() > scoutingAccuracy + 0.30) {
      isPerceivedWeakened = !realWeakened;
    }

    // --- SZACOWANA LICZBA KONTUZJOWANYCH ---
    const injuredCountNoise = Math.round((Math.random() * 2 - 1) * errorMargin * 0.15);
    const perceivedInjuredCount = Math.max(0, realInjuredCount + injuredCountNoise);

    return {
      perceivedPower,
      perceivedTacticId,
      perceivedInjuredCount,
      perceivedFatigueLevel,
      isPerceivedWeakened,
      scoutingAccuracy,
      errorMargin,
    };
  },
};
