import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

interface EncryptedCredentialsPayload {
  version: 1;
  algorithm: 'aes-256-gcm';
  iv: string;
  authTag: string;
  ciphertext: string;
}

@Injectable()
export class ProviderCredentialsCryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>(
      'PROVIDER_CREDENTIALS_ENCRYPTION_KEY',
    );

    if (!encryptionKey) {
      throw new Error('PROVIDER_CREDENTIALS_ENCRYPTION_KEY is not configured');
    }

    const decodedKey = Buffer.from(encryptionKey, 'base64');

    if (decodedKey.length !== 32) {
      throw new Error(
        'PROVIDER_CREDENTIALS_ENCRYPTION_KEY must be a 32-byte base64 encoded key',
      );
    }

    this.key = decodedKey;
  }

  encrypt(credentials: Record<string, string>, context: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    cipher.setAAD(Buffer.from(context, 'utf8'));

    const plaintext = JSON.stringify(credentials);

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const payload: EncryptedCredentialsPayload = {
      version: 1,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };

    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  }

  decrypt(encryptedValue: string, context: string): Record<string, string> {
    let payload: EncryptedCredentialsPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encryptedValue, 'base64').toString('utf8'),
      ) as EncryptedCredentialsPayload;
    } catch {
      throw new Error('Invalid encrypted credentials payload');
    }

    if (payload.version !== 1 || payload.algorithm !== 'aes-256-gcm') {
      throw new Error('Unsupported encrypted credentials format');
    }

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(payload.iv, 'base64'),
      );

      decipher.setAAD(Buffer.from(context, 'utf8'));

      decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(payload.ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');

      const credentials = JSON.parse(plaintext) as unknown;

      if (
        !credentials ||
        typeof credentials !== 'object' ||
        Array.isArray(credentials)
      ) {
        throw new Error();
      }

      for (const value of Object.values(credentials)) {
        if (typeof value !== 'string') {
          throw new Error();
        }
      }

      return credentials as Record<string, string>;
    } catch {
      throw new Error('Unable to decrypt provider credentials');
    }
  }
}
