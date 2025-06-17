import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';

// ProductsController의 단위 테스트를 위한 Mock Service 타입 정의
// ProductsService의 메서드들을 jest.Mock으로 대체합니다.
type MockProductsService = Partial<Record<keyof ProductsService, jest.Mock>>;

// 각 테스트마다 새로운 Mock Service 인스턴스를 생성하는 헬퍼 함수
const createMockProductsService = (): MockProductsService => ({
  create: jest.fn(),
  findAll: jest.fn(),
});

// AuthGuard를 항상 통과하도록 하는 Mock Guard
const mockAuthGuard = { canActivate: jest.fn(() => true) };

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockService: MockProductsService;

  // 테스트 모듈을 초기화하고, Controller와 Mock Service, Guard를 설정합니다.
  beforeEach(async () => {
    mockService = createMockProductsService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))  // JWT 인증 Guard 무시 (항상 통과)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  // create 엔드포인트 테스트
  describe('create 메서드', () => {
    it('요청 바디를 서비스 create 메서드에 전달하고, 생성된 제품을 반환해야 한다', async () => {
      // given: 컨트롤러에 전달할 DTO와 서비스가 반환할 값
      const dto = { name: '테스트 제품', description: '설명', sku: 'TESTSKU' };
      const createdProduct = { id: 1, ...dto };
      mockService.create!.mockResolvedValue(createdProduct);

      // when: 컨트롤러의 create 호출
      const result = await controller.create(dto);

      // then: 서비스 create 호출 검증 및 반환 값 확인
      expect(mockService.create).toHaveBeenCalledWith(dto.name, dto.description, dto.sku);
      expect(result).toEqual(createdProduct);
    });
  });

  // findAll 엔드포인트 테스트
  describe('findAll 메서드', () => {
    it('서비스의 findAll을 호출하여 모든 제품을 반환해야 한다', async () => {
      // given: 서비스가 반환할 제품 목록
      const products = [
        { id: 1, name: '제품 A', description: '설명 A', sku: 'SKU_A' },
      ];
      mockService.findAll!.mockResolvedValue(products);

      // when: 컨트롤러의 findAll 호출
      const result = await controller.findAll();

      // then: 서비스 findAll 호출 검증 및 반환 값 확인
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });
});
