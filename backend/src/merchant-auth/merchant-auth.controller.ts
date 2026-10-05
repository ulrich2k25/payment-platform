import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { MerchantLoginDto } from './dto/merchant-login.dto';
import { MerchantSignupDto } from './dto/merchant-signup.dto';
import { MerchantAuthService } from './merchant-auth.service';
import { MerchantSessionGuard } from './merchant-session.guard';

@Controller('merchant/auth')
export class MerchantAuthController {
  constructor(private readonly merchantAuthService: MerchantAuthService) {}

  @Post('signup')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  signup(@Body() dto: MerchantSignupDto) {
    return this.merchantAuthService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  login(@Body() dto: MerchantLoginDto) {
    return this.merchantAuthService.login(dto);
  }

  @Get('me')
  @UseGuards(MerchantSessionGuard)
  me(@Req() req: any) {
    return {
      user: req.merchantUser,
      merchant: req.merchant,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MerchantSessionGuard)
  logout(@Req() req: any) {
    return this.merchantAuthService.logoutSession(req.merchantSession.id);
  }
}
