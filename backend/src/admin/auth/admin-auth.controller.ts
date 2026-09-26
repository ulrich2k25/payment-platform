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

import { AdminApiKeyGuard } from '../guards/admin-api-key.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';
import { AdminCredentialsDto } from './dto/admin-credentials.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('bootstrap')
  @UseGuards(AdminApiKeyGuard)
  bootstrap(@Body() dto: AdminCredentialsDto) {
    return this.adminAuthService.bootstrapAdmin(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminCredentialsDto) {
    return this.adminAuthService.login(dto);
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  me(@Req() req: any) {
    return req.adminUser;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminSessionGuard)
  logout(@Req() req: any) {
    return this.adminAuthService.logoutSession(req.adminSession.id);
  }
}
