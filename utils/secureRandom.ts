const UINT32_MAX = 0x100000000;

function randomUint32(): number {
  const arr = new Uint32Array(1);
  const cryptoRef = globalThis.crypto;

  if (cryptoRef?.getRandomValues) {
    cryptoRef.getRandomValues(arr);
    return arr[0];
  }

  // Non-secure fallback for UI/non-critical random needs
  return Math.floor(Math.random() * UINT32_MAX);
}

export function randomFloat(min = 0, max = 1): number {
  if (max <= min) return min;
  const unit = randomUint32() / UINT32_MAX;
  return min + unit * (max - min);
}

export function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  return Math.floor(randomFloat(0, maxExclusive));
}

export function randomChoice<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('Cannot choose from an empty array.');
  return arr[randomInt(arr.length)];
}

export function randomBool(): boolean {
  return (randomUint32() & 1) === 1;
}
