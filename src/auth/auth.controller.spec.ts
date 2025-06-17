import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';

// AuthController 단위 테스트를 위한 Mock AuthService 타입 정의
// AuthService의 메서드들을 jest.Mock으로 대체합니다.
type MockAuthService = Partial<Record<keyof AuthService, jest.Mock>>;

// 각 테스트마다 새로운 Mock AuthService 인스턴스를 생성하는 헬퍼 함수
const createMockAuthService = (): MockAuthService => ({
  validateUser: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: MockAuthService;

  // 테스트 모듈을 초기화하고, Controller와 Mock Service를 설정합니다.
  beforeEach(async () => {
    mockService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // login 엔드포인트 테스트
  describe('login 메서드', () => {
    it('유효한 사용자 정보가 주어지면 토큰을 반환해야 한다', async () => {
      const dto = { email: 'a@b.com', password: 'pass123' };
      const user = { id: 1, email: dto.email } as User;
      const token = { access_token: 'token' };

      mockService.validateUser!.mockResolvedValue(user);
      mockService.login!.mockReturnValue(token);

      const result = await controller.login(dto);

      expect(mockService.validateUser).toHaveBeenCalledWith(dto.email, dto.password);
      expect(mockService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(token);
    });

    it('유효하지 않은 사용자 정보면 UnauthorizedException을 던져야 한다', async () => {
      const dto = { email: 'x@x', password: 'y123123' };
      mockService.validateUser!.mockResolvedValue(null);

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // register 엔드포인트 테스트
  describe('register 메서드', () => {
    it('새로운 사용자 등록 시 AuthService.register를 호출하고 사용자 반환해야 한다', async () => {
      const dto = { email: 'b@b.com', password: 'pwd123', name: 'name' };
      const newUser = { id: 2, email: dto.email, name: dto.name } as User;
      mockService.register!.mockResolvedValue(newUser);

      const result = await controller.signup(dto);

      expect(mockService.register).toHaveBeenCalledWith(dto.email, dto.password, dto.name);
      expect(result).toEqual(newUser);
    });
  });
});
