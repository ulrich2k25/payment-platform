jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { ProviderCredentialsCryptoService } from './provider-credentials-crypto.service';

describe('ProviderCredentialsCryptoService', () => {
  let service: ProviderCredentialsCryptoService;

  const encryptionKey = Buffer.alloc(32, 7).toString('base64');

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'PROVIDER_CREDENTIALS_ENCRYPTION_KEY') {
          return encryptionKey;
        }

        return undefined;
      }),
    };

    service = new ProviderCredentialsCryptoService(configService as never);
  });

  it('encrypts and decrypts provider credentials', () => {
    const credentials = {
      apiuser: 'test_fapshi_user',
      apikey: 'test_fapshi_secret_123',
    };

    const context = 'merchant-provider-account:account-1:merchant-1:FAPSHI';

    const encrypted = service.encrypt(credentials, context);

    expect(encrypted).not.toContain('test_fapshi_secret_123');

    const decrypted = service.decrypt(encrypted, context);

    expect(decrypted).toEqual(credentials);
  });

  it('rejects decryption with a different context', () => {
    const encrypted = service.encrypt(
      {
        apiuser: 'test-user',
        apikey: 'test-secret',
      },
      'merchant-provider-account:account-1:merchant-1:FAPSHI',
    );

    expect(() =>
      service.decrypt(
        encrypted,
        'merchant-provider-account:account-2:merchant-1:FAPSHI',
      ),
    ).toThrow('Unable to decrypt provider credentials');
  });

  it('rejects a tampered encrypted payload', () => {
    const encrypted = service.encrypt(
      {
        apiuser: 'test-user',
        apikey: 'test-secret',
      },
      'merchant-provider-account:account-1:merchant-1:FAPSHI',
    );

    const decoded = JSON.parse(
      Buffer.from(encrypted, 'base64').toString('utf8'),
    ) as {
      version: number;
      algorithm: string;
      iv: string;
      authTag: string;
      ciphertext: string;
    };

    decoded.ciphertext = decoded.ciphertext.slice(0, -4) + 'AAAA';

    const tampered = Buffer.from(JSON.stringify(decoded), 'utf8').toString(
      'base64',
    );

    expect(() =>
      service.decrypt(
        tampered,
        'merchant-provider-account:account-1:merchant-1:FAPSHI',
      ),
    ).toThrow('Unable to decrypt provider credentials');
  });
});
