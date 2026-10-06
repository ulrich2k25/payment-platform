import {
  PaymentMethod,
  TransactionStatus,
} from '../../../generated/prisma/client';
import { FapshiProvider } from './fapshi.provider';

describe('FapshiProvider', () => {
  let provider: FapshiProvider;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = new FapshiProvider();

    process.env.FAPSHI_BASE_URL = 'https://sandbox.fapshi.test';

    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    delete process.env.FAPSHI_BASE_URL;
  });

  it('uses Direct Pay by default when no payment mode is configured', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Payment initiated',
        transId: 'direct-trans-123',
        dateInitiated: '2026-10-07T00:00:00.000Z',
      }),
    } as Response);

    const result = await provider.createPayment({
      paymentId: 'payment-1',
      merchantId: 'merchant-1',
      amount: 1000,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      reference: 'ORDER-001',
      payerPhoneNumber: '+237670000000',
      providerCredentials: {
        apiuser: 'test-user',
        apikey: 'test-key',
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://sandbox.fapshi.test/direct-pay',
      expect.objectContaining({
        method: 'POST',
        headers: {
          apiuser: 'test-user',
          apikey: 'test-key',
          'Content-Type': 'application/json',
        },
      }),
    );

    const [, options] = fetchSpy.mock.calls[0];

    expect(JSON.parse(options.body as string)).toEqual({
      amount: 1000,
      phone: '670000000',
      userId: 'merchant-1',
      externalId: 'payment-1',
      message: 'Payment ORDER-001',
    });

    expect(result).toEqual({
      providerReference: 'direct-trans-123',
      status: 'PENDING',
    });
  });

  it('uses Initiate Pay when HOSTED mode is configured', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Payment initiated',
        link: 'https://checkout.fapshi.test/pay/abc123',
        transId: 'hosted-trans-123',
        dateInitiated: '2026-10-07T00:00:00.000Z',
      }),
    } as Response);

    const result = await provider.createPayment({
      paymentId: 'payment-2',
      merchantId: 'merchant-1',
      amount: 2500,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      reference: 'PREMIUM-001',
      providerCredentials: {
        apiuser: 'test-user',
        apikey: 'test-key',
      },
      providerConfiguration: {
        paymentMode: 'HOSTED',
        redirectUrl: 'https://getubiza.com/payment/return',
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://sandbox.fapshi.test/initiate-pay',
      expect.objectContaining({
        method: 'POST',
        headers: {
          apiuser: 'test-user',
          apikey: 'test-key',
          'Content-Type': 'application/json',
        },
      }),
    );

    const [, options] = fetchSpy.mock.calls[0];

    expect(JSON.parse(options.body as string)).toEqual({
      amount: 2500,
      userId: 'merchant-1',
      externalId: 'payment-2',
      message: 'Payment PREMIUM-001',
      redirectUrl: 'https://getubiza.com/payment/return',
    });

    expect(result).toEqual({
      providerReference: 'hosted-trans-123',
      status: 'PENDING',
      checkoutUrl: 'https://checkout.fapshi.test/pay/abc123',
    });
  });

  it('does not require a phone number for HOSTED payments', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        transId: 'hosted-trans-456',
        link: 'https://checkout.fapshi.test/pay/xyz456',
      }),
    } as Response);

    await expect(
      provider.createPayment({
        paymentId: 'payment-3',
        merchantId: 'merchant-1',
        amount: 1000,
        currency: 'XAF',
        method: PaymentMethod.MOBILE_MONEY,
        reference: 'BOOST-001',
        providerCredentials: {
          apiuser: 'test-user',
          apikey: 'test-key',
        },
        providerConfiguration: {
          paymentMode: 'HOSTED',
        },
      }),
    ).resolves.toEqual({
      providerReference: 'hosted-trans-456',
      status: 'PENDING',
      checkoutUrl: 'https://checkout.fapshi.test/pay/xyz456',
    });
  });

  it('still requires a phone number for DIRECT payments', async () => {
    await expect(
      provider.createPayment({
        paymentId: 'payment-4',
        merchantId: 'merchant-1',
        amount: 1000,
        currency: 'XAF',
        method: PaymentMethod.MOBILE_MONEY,
        reference: 'ORDER-004',
        providerCredentials: {
          apiuser: 'test-user',
          apikey: 'test-key',
        },
        providerConfiguration: {
          paymentMode: 'DIRECT',
        },
      }),
    ).rejects.toThrow(
      'payerPhoneNumber is required for Fapshi Direct Pay payments',
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an unsupported payment mode', async () => {
    await expect(
      provider.createPayment({
        paymentId: 'payment-5',
        merchantId: 'merchant-1',
        amount: 1000,
        currency: 'XAF',
        method: PaymentMethod.MOBILE_MONEY,
        reference: 'ORDER-005',
        providerCredentials: {
          apiuser: 'test-user',
          apikey: 'test-key',
        },
        providerConfiguration: {
          paymentMode: 'UNKNOWN',
        },
      }),
    ).rejects.toThrow('Fapshi paymentMode must be DIRECT or HOSTED');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps a successful Fapshi status to COMPLETED', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        transId: 'hosted-trans-123',
        status: 'SUCCESSFUL',
      }),
    } as Response);

    const result = await provider.getPaymentStatus({
      providerReference: 'hosted-trans-123',
      providerCredentials: {
        apiuser: 'test-user',
        apikey: 'test-key',
      },
    });

    expect(result).toEqual({
      status: TransactionStatus.COMPLETED,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://sandbox.fapshi.test/payment-status/hosted-trans-123',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
