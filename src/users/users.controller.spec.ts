import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

// UsersController 단위 테스트 (UsersService 주입 및 모킹 포함)
describe('UsersController', () => {
    let controller: UsersController;
    let mockUsersService: Partial<Record<keyof UsersService, jest.Mock>>;

    // JWT AuthGuard 모킹: 통과/거부 시나리오를 모두 테스트
    const mockAuthGuard = {
        canActivate: jest.fn((context: ExecutionContext) => true),
    };

    beforeEach(async () => {
        // UsersService 메서드 모킹
        mockUsersService = {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                { provide: UsersService, useValue: mockUsersService },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue(mockAuthGuard)
            .compile();

        controller = module.get<UsersController>(UsersController);
    });

    // AuthGuard 통과 시나리오
    describe('AuthGuard 정상 동작', () => {
        it('canActivate가 true를 반환하면 요청이 통과되어야 한다', () => {
            mockAuthGuard.canActivate.mockReturnValueOnce(true);
            const canActivate = mockAuthGuard.canActivate({} as ExecutionContext);
            expect(canActivate).toBe(true);
        });

        it('getMe 메서드는 req.user를 반환한다', () => {
            const user = { id: 1, email: 'test@example.com' };
            const req = { user } as any;
            const result = controller.getMe(req);
            expect(result).toEqual(user);
        });
    });

    // AuthGuard 거부 시나리오
    describe('AuthGuard 예외 처리', () => {
        it('canActivate가 false를 반환하면 UnauthorizedException 발생', () => {
            mockAuthGuard.canActivate.mockReturnValueOnce(false);
            expect(() => mockAuthGuard.canActivate({} as ExecutionContext)).toThrow(UnauthorizedException);
        });
    });

    // getMe 메서드 테스트
    describe('getMe 메서드', () => {
        it('인증된 사용자 정보를 Request 객체에서 가져와 반환해야 한다', () => {
            const user = { id: 1, email: 'test@example.com' };
            const req = { user } as any;

            const result = controller.getMe(req);

            expect(result).toEqual(user);
        });
    });
});


