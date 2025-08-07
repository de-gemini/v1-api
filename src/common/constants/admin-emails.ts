export const ADMIN_EMAILS: string[] = [
  'aloodunayo7@gmail.com',
  'kelly.n@degeminiservices.co.uk',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getValidAdminEmails(): string[] {
  return ADMIN_EMAILS.filter(email => EMAIL_REGEX.test(email));
}