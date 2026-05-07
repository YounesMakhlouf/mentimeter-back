export const Topics = {
  ANIMALS: "animals",
  SCIENCE: "science",
  PHYSICS: "physics",
  BIOLOGY: "biology",
  CHEMISTRY: "chemistry",
  MATH: "math",
  GEOGRAPHY: "geography",
  HISTORY: "history",
  SPORTS: "sports",
  MOVIES: "movies",
  MUSIC: "music",
  LITERATURE: "literature",
  ART: "art",
  POLITICS: "politics",
  PROGRAMMING: "programming",
  SPACE: "space",
} as const;
export type Topic = (typeof Topics)[keyof typeof Topics];
