import crypto from 'crypto';

export function generateVerificationToken(): {
  token: string;
  hash: string;
  expiry: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return { token, hash, expiry };
}

export function generateResetToken(): {
  token: string;
  hash: string;
  expiry: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

  return { token, hash, expiry };
}
