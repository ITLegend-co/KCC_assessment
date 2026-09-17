export const calculateBoulderPoints = (
  attemptsToTop: number | null | undefined,
  attemptsToZone: number | null | undefined,
  totalAttempts?: number | null,
): number => {
  const topPoints = attemptsToTop && attemptsToTop > 0
    ? 25 - (attemptsToTop - 1) * 0.1
    : 0;
  // Once Zone is reached, later unsuccessful attempts still reduce the score.
  // Older records do not have totalAttempts, so fall back to the saved AZ.
  const zonePenaltyAttempts = totalAttempts && totalAttempts > 0
    ? totalAttempts
    : attemptsToZone;
  const zonePoints = attemptsToZone && attemptsToZone > 0
    ? 10 - ((zonePenaltyAttempts ?? attemptsToZone) - 1) * 0.1
    : 0;

  return Math.max(0, Number(Math.max(topPoints, zonePoints).toFixed(1)));
};
