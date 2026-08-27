export const calculateBoulderPoints = (
  attemptsToTop: number | null | undefined,
  attemptsToZone: number | null | undefined,
): number => {
  const topPoints = attemptsToTop && attemptsToTop > 0
    ? 25 - (attemptsToTop - 1) * 0.1
    : 0;
  const zonePoints = attemptsToZone && attemptsToZone > 0
    ? 10 - (attemptsToZone - 1) * 0.1
    : 0;

  return Math.max(0, Number(Math.max(topPoints, zonePoints).toFixed(1)));
};

