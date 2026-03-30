export const MIN_PASSWORD_LENGTH = 12;

export function isPasswordLongEnough(password: string | undefined | null): boolean {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}
