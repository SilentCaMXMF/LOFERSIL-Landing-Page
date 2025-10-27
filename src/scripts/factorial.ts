// Function to calculate the factorial of a number
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
