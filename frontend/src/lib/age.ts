export const MIN_AGE = 12;

export function getAge(value: string, today = new Date()): number {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  let age = today.getFullYear() - y;
  const birthdayPassed =
    today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!birthdayPassed) age--;
  return age;
}