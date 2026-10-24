import { registerDecorator, type ValidationOptions } from 'class-validator';

export function MinAge(minAge: number, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'minAge',
      target: object.constructor,
      propertyName,
      options: {
        message: `You must be at least ${minAge} years old to create an account`,
        ...options,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const dob = new Date(value);
          if (Number.isNaN(dob.getTime())) return false;

          const now = new Date();
          let age = now.getUTCFullYear() - dob.getUTCFullYear();
          const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
          if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
          return age >= minAge;
        },
      },
    });
}