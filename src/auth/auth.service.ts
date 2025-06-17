import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(password, user.password))) {
            return user;
        }
        return null;
    }

    async login(user: any) {
        const payload = { sub: user.id, email: user.email, name: user.name };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(email: string, password: string, name: string) {
        const hashed = await bcrypt.hash(password, 10);
        return this.usersService.createUser(email, hashed, name);
    }
}