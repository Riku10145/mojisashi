// stopped-by: no-restricted-syntax
let target!: number;

export function setTarget(apply: (set: (value: number) => void) => void): void {
  apply((value) => {
    target = value;
  });
}

export function remaining(length: number): number {
  return target - length;
}
