import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// AES-GCM provides encryption plus an auth tag, so decrypt can detect tampered
// credential data. In real deployments ENCRYPTION_KEY must be stable.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text) return text;
  
  try {
    // Format: iv:authTag:ciphertext. Returning the original text for other
    // shapes keeps old/plain credentials readable during migration.
    const parts = text.split(':');
    if (parts.length !== 3) return text;
    
    const ivHex = parts[0] as string;
    const authTagHex = parts[1] as string;
    const encryptedText = parts[2] as string;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8') as any;
    decrypted += decipher.final('utf8') as any;
    
    return decrypted as string;
  } catch {
    console.warn('Stored credential could not be decrypted with the current ENCRYPTION_KEY.');
    return '';
  }
}
