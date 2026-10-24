import { applyDecorators } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function IsValidPassword() {
  return applyDecorators(
    IsString(),
    Matches(PASSWORD_REGEX, {
      message:
        'Password must be at least 8 characters and contain a lowercase letter, an uppercase letter and a number',
    }),
  );
}