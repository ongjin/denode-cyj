import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

// AuthService 단위 테스트를 위한 Mock UsersService 및 JwtService 타입 정의
type MockUsersService = Partial<Record<keyof UsersService, jest.Mock>>;
type MockJwtService = Partial<Record<keyof JwtService, jest.Mock>>;

// 각 테스트마다 새로운 Mock 인스턴스를 생성하는 헬퍼 함수
const createMockUsersService = (): MockUsersService => ({
    findByEmail: jest.fn(),
    createUser: jest.fn(),
});

const createMockJwtService = (): MockJwtService => ({
    sign: jest.fn(),
});

describe('AuthService', () => {
    let service: AuthService;
    let usersService: MockUsersService;
    let jwtService: MockJwtService;

    beforeEach(async () => {
        usersService = createMockUsersService();
        jwtService = createMockJwtService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: usersService },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    // validateUser 메서드 테스트
    describe('validateUser', () => {
        it('올바른 이메일과 비밀번호가 주어지면 사용자 객체를 반환해야 한다', async () => {
            const user = { id: 1, email: 'a@b.com', password: 'hashedpass' } as User;
            usersService.findByEmail!.mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const result = await service.validateUser('a@b.com', 'password');

            expect(usersService.findByEmail).toHaveBeenCalledWith('a@b.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('password', user.password);
            expect(result).toEqual(user);
        });

        it('비밀번호가 일치하지 않으면 null을 반환해야 한다', async () => {
            const user = { id: 1, email: 'a@b.com', password: 'hashedpass' } as User;
            usersService.findByEmail!.mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            const result = await service.validateUser('a@b.com', 'wrong');

            expect(result).toBeNull();
        });

        it('사용자가 존재하지 않으면 null을 반환해야 한다', async () => {
            usersService.findByEmail!.mockResolvedValue(null);

            const result = await service.validateUser('x@x.com', 'password');

            expect(result).toBeNull();
        });
    });

    // login 메서드 테스트
    describe('login', () => {
        it('유효한 사용자가 주어지면 access_token을 반환해야 한다', async () => {
            const user = { id: 1, email: 'a@b.com', name: 'username' } as User;
            jwtService.sign!.mockReturnValue('signed-token');

            const result = await service.login(user);

            expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, name: user.name });
            expect(result).toEqual({ access_token: 'signed-token' });
        });
    });

    // register 메서드 테스트
    describe('register', () => {
        it('새로운 사용자 등록 시 createUser를 호출하고 결과를 반환해야 한다', async () => {
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpass');
            const newUser = { id: 2, email: 'b@b.com', password: 'hashedpass', name: 'name' } as User;
            usersService.createUser!.mockResolvedValue(newUser);

            const result = await service.register('b@b.com', 'password', 'name');

            expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
            expect(usersService.createUser).toHaveBeenCalledWith('b@b.com', 'hashedpass', 'name');
            expect(result).toEqual(newUser);
        });
    });
});
