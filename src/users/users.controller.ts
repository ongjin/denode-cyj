import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    @Get('me')
    @ApiOperation({ summary: '내 프로필 조회 (JWT 인증 필요)' })
    getMe(@Request() req) {
        return req.user;
    }
}