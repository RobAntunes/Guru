// Complex flow test
export function veryComplexFlow(x: number): string | number {
  // Multiple nested conditions
  if (x > 10) {
    if (x > 20) {
      if (x > 30) {
        if (x > 40) {
          return "extremely large";
        }
        return "very large";
      }
      return x * 3;
    }
    return x * 2;
  } else if (x < 0) {
    if (x < -10) {
      throw new Error("Very negative");
    }
    throw new Error("Negative not allowed");
  }
  
  // Loop with complex logic
  let result = 0;
  for (let i = 0; i < x; i++) {
    if (i % 2 === 0) {
      result += i;
    } else {
      result -= i;
    }
  }
  
  // Another loop
  while (result > 10) {
    result = result / 2;
  }
  
  return result.toString();
}

// Function with implicit any
export function problematicFunction(data) {
  return data.value;
}

// Variable with type mutations
export function typeChangingFlow() {
  let value: string | number = "hello";
  console.log(value); // string
  
  value = 42;
  console.log(value); // number
  
  if (Math.random() > 0.5) {
    value = "world";
  }
  
  return value;
}
