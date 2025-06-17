import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';

// ProductsService의 단위 테스트를 위한 Mock Repository 타입 정의
// Repository 메서드들을 jest.Mock으로 대체합니다.
type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// 매 테스트마다 새로운 Mock Repository 인스턴스를 생성하는 헬퍼 함수
const createMockRepository = <T extends ObjectLiteral = ObjectLiteral>(): MockRepository<T> => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepo: MockRepository<Product>;

  // 각 테스트 전에 NestJS 테스트 모듈을 초기화하고, 서비스와 Mock Repository를 가져옵니다.
  beforeEach(async () => {
    mockRepo = createMockRepository<Product>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  // create 메서드에 대한 단위 테스트
  describe('create 메서드', () => {
    it('새로운 제품을 생성하고 저장한 결과를 반환해야 한다', async () => {
      // 주어진 입력 데이터 정의
      const name = '테스트 제품';
      const description = '테스트 설명';
      const sku = 'TESTSKU';

      // Mock Repository의 create와 save 메서드 동작 정의
      const createdProduct = { id: 1, name, description, sku } as Product;
      mockRepo.create!.mockReturnValue(createdProduct);
      mockRepo.save!.mockResolvedValue(createdProduct);

      // 서비스의 create 실행
      const result = await service.create(name, description, sku);

      // Repository 메서드 호출 여부 및 결과 검증
      expect(mockRepo.create).toHaveBeenCalledWith({ name, description, sku });
      expect(mockRepo.save).toHaveBeenCalledWith(createdProduct);
      expect(result).toEqual(createdProduct);
    });
  });

  // findAll 메서드에 대한 단위 테스트
  describe('findAll 메서드', () => {
    it('모든 제품을 조회하여 반환해야 한다', async () => {
      // Mock Repository의 find 메서드가 반환할 데이터 정의
      const productsList = [
        { id: 1, name: '제품 A', description: '설명 A', sku: 'SKU_A' },
      ] as Product[];
      mockRepo.find!.mockResolvedValue(productsList);

      // 서비스의 findAll 실행
      const result = await service.findAll();

      // Repository find 호출과 반환 값 검증
      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual(productsList);
    });
  });
});
