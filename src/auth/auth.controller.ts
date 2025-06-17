import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup')
    @ApiOperation({ summary: '회원가입' })
    @ApiBody({
        schema: {
            example: {
                email: 'test@example.com',
                password: '123456',
                name: '테스트'
            },
        },
    })
    async signup(@Body() body: { email: string; password: string, name: string }) {
        return this.authService.register(body.email, body.password, body.name);
    }

    @Post('login')
    @ApiOperation({ summary: '로그인 및 JWT 토큰 발급' })
    @ApiBody({
        schema: {
            example: {
                email: 'test@example.com',
                password: '123456',
            },
        },
    })
    async login(@Body() body: { email: string; password: string }) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }
}
