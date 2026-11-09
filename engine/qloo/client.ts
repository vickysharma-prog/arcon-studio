// Arcon Studio has no outside taste service: every taste read answers empty, and the engine designs from the
// interview and the quiz alone. Callers already treat an empty answer as "nothing known".
// ponytail: empty until Studio's own taste engine fills these in (task: taste without Qloo).

export type Params = Record<string, string | number | boolean | undefined>;

export async function qloo<T = unknown>(_path: string, _params: Params): Promise<T> {
  return {} as T;
}
