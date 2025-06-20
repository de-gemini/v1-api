import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(configService: ConfigService) {
    super({
      // ...options
    });
    Logger.log('JwtStrategy initialized');
  }

  canActivate(context) {
    // Logger.log('JwtAuthGuard canActivate called');
    return super.canActivate(context);
  }
} 