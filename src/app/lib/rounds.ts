export const DEFAULT_ROUNDS = ['Qualifier', 'Semi Final', 'Final'];

export const normalizeRounds = (value: unknown): string[] => {
  const items = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.values(value)
      : [];

  const rounds = items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return rounds.length > 0 ? rounds : DEFAULT_ROUNDS;
};

