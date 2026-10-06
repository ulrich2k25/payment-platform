jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { validate } from 'class-validator';
import { PaymentMethod, PaymentProvider } from '../../generated/prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    create: jest.Mock;
  };

  beforeEach(() => {
    paymentsService = {
      create: jest.fn(),
    };

    controller = new PaymentsController(
      paymentsService as unknown as PaymentsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('accepts a MOBILE_MONEY payment without payerPhoneNumber at DTO level', async () => {
    const dto = Object.assign(new CreatePaymentDto(), {
      amount: 1000,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      provider: PaymentProvider.FAPSHI,
      reference: 'BOOST-001',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes an undefined payerPhoneNumber to the payment service', async () => {
    paymentsService.create.mockResolvedValue({
      id: 'payment-1',
      status: 'PENDING',
      checkoutUrl: 'https://checkout.fapshi.test/pay/abc123',
    });

    const body: CreatePaymentDto = {
      amount: 1000,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      provider: PaymentProvider.FAPSHI,
      reference: 'BOOST-001',
    };

    await controller.create(
      {
        merchant: {
          id: 'merchant-1',
        },
      },
      'idem-hosted-001',
      body,
    );

    expect(paymentsService.create).toHaveBeenCalledWith(
      'merchant-1',
      1000,
      'XAF',
      PaymentMethod.MOBILE_MONEY,
      'BOOST-001',
      'idem-hosted-001',
      undefined,
      PaymentProvider.FAPSHI,
    );
  });
});
