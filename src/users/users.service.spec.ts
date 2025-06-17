import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

// UsersService 단위 테스트를 위한 Mock Repository 타입 정의
// Repository 메서드들을 jest.Mock으로 대체합니다.
type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// 매 테스트마다 새로운 Mock Repository 인스턴스를 생성하는 헬퍼 함수
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: MockRepository<User>;

  // 테스트 모듈 초기화 및 Mock Repository 설정
  beforeEach(async () => {
    mockRepo = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // findByEmail 메서드 테스트
  describe('findByEmail 메서드', () => {
    it('주어진 이메일에 해당하는 사용자를 반환해야 한다', async () => {
      const email = 'test@example.com';
      const user = { id: 1, email } as User;
      mockRepo.findOne!.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('사용자가 없으면 null을 반환해야 한다', async () => {
      mockRepo.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  // createUser 메서드 테스트
  describe('createUser 메서드', () => {
    it('새로운 사용자 생성 후 저장된 사용자 객체를 반환해야 한다', async () => {
      const email = 'new@example.com';
      const password = 'pass';
      const name = 'username';
      const createdUser = { id: 2, email, password, name } as User;
      mockRepo.create!.mockReturnValue(createdUser);
      mockRepo.save!.mockResolvedValue(createdUser);

      const result = await service.createUser(email, password, name);

      expect(mockRepo.create).toHaveBeenCalledWith({ email, password, name });
      expect(mockRepo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });
});