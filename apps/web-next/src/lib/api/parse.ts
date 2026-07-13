export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function recordField(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const field = value[key];
  if (!isRecord(field)) throw invalidField(key, 'an object');
  return field;
}

export function arrayField(value: Record<string, unknown>, key: string): unknown[] {
  const field = value[key];
  if (!Array.isArray(field)) throw invalidField(key, 'a list');
  return field;
}

export function stringField(value: Record<string, unknown>, key: string): string {
  const field = value[key];
  if (typeof field !== 'string') throw invalidField(key, 'text');
  return field;
}

export function nullableStringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  if (field === null || field === undefined) return null;
  if (typeof field !== 'string') throw invalidField(key, 'text or null');
  return field;
}

export function numberField(value: Record<string, unknown>, key: string): number {
  const field = value[key];
  if (typeof field !== 'number' || !Number.isFinite(field)) throw invalidField(key, 'a number');
  return field;
}

export function nullableNumberField(value: Record<string, unknown>, key: string): number | null {
  const field = value[key];
  if (field === null || field === undefined) return null;
  if (typeof field !== 'number' || !Number.isFinite(field)) throw invalidField(key, 'a number or null');
  return field;
}

export function booleanField(value: Record<string, unknown>, key: string): boolean {
  const field = value[key];
  if (typeof field !== 'boolean') throw invalidField(key, 'true or false');
  return field;
}

export function optionalBooleanField(value: Record<string, unknown>, key: string): boolean | undefined {
  const field = value[key];
  if (field === undefined) return undefined;
  if (typeof field !== 'boolean') throw invalidField(key, 'true or false');
  return field;
}

export function enumField<T extends string>(
  value: Record<string, unknown>,
  key: string,
  supported: readonly T[],
): T {
  const field = stringField(value, key);
  const match = supported.find((candidate) => candidate === field);
  if (!match) throw invalidField(key, 'a supported value');
  return match;
}

export function stringListField(value: Record<string, unknown>, key: string): string[] {
  return arrayField(value, key).map((item) => {
    if (typeof item !== 'string') throw invalidField(key, 'a list of text');
    return item;
  });
}

export function safeMediaUrl(value: string): boolean {
  return value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://');
}

function invalidField(key: string, expected: string): Error {
  return new Error(`Expected ${key} to be ${expected}.`);
}
