// Simple test file for LTF integration tests
export function calculateSum(a: number, b: number): number {
  return a + b;
}

export class Calculator {
  add(a: number, b: number): number {
    return calculateSum(a, b);
  }
  
  multiply(a: number, b: number): number {
    return a * b;
  }
}

export const defaultCalculator = new Calculator();