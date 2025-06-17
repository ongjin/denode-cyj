import { Test, TestingModule } from '@nestjs/testing';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { InboundStockDto } from './dto/inbound-stock.dto';
import { OutboundStockDto } from './dto/outbound-stock.dto';

describe('StocksController 테스트', () => {
  let controller: StocksController;
  let service: Partial<Record<keyof StocksService, jest.Mock>>;

  beforeEach(async () => {
    // 서비스 메서드 Mock 구현
    service = {
      inbound: jest.fn(),
      outbound: jest.fn(),
      getHistory: jest.fn(),
      getPagedStock: jest.fn(),
      getPagedStocks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [{ provide: StocksService, useValue: service }],
    }).compile();

    controller = module.get<StocksController>(StocksController);
  });

  describe('inbound 메서드', () => {
    it('DTO로 전달된 데이터를 기반으로 service.inbound 호출', async () => {
      // 테스트용 DTO와 예상 결과 설정
      const dto: InboundStockDto = { productId: 1, quantity: 3, expirationDate: '2025-06-20' };
      const mockResult = { id: 1, quantity: 3 };
      service.inbound!.mockResolvedValue(mockResult);

      // 컨트롤러 메서드 실행
      const result = await controller.inbound(dto);

      // service.inbound 호출 검증
      expect(service.inbound).toHaveBeenCalledWith(1, 3, '2025-06-20');
      // 반환값 검증
      expect(result).toEqual(mockResult);
    });
  });

  describe('outbound 메서드', () => {
    it('DTO로 전달된 데이터를 기반으로 service.outbound 호출', async () => {
      const dto: OutboundStockDto = { productId: 2, quantity: 5 };
      const mockResult = { success: true };
      service.outbound!.mockResolvedValue(mockResult);

      const result = await controller.outbound(dto);

      expect(service.outbound).toHaveBeenCalledWith(2, 5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getHistory 메서드', () => {
    it('Query 파라미터를 service.getHistory로 전달', async () => {
      const mockData = [{ id: 1, quantity: 3 }];
      service.getHistory!.mockResolvedValue(mockData);

      const result = await controller.getHistory(3);

      expect(service.getHistory).toHaveBeenCalledWith(3);
      expect(result).toEqual(mockData);
    });
  });

  describe('getStock 메서드', () => {
    it('productId, page, limit를 service.getPagedStock로 전달', async () => {
      const mockPage = { data: [], total: 0 };
      service.getPagedStock!.mockResolvedValue(mockPage);

      const result = await controller.getStock(4, 2, 7);

      expect(service.getPagedStock).toHaveBeenCalledWith(4, 2, 7);
      expect(result).toEqual(mockPage);
    });
  });

  describe('getStocks 메서드', () => {
    it('page, limit를 service.getPagedStocks로 전달', async () => {
      const mockPage = { data: [], total: 5 };
      service.getPagedStocks!.mockResolvedValue(mockPage);

      const result = await controller.getStocks(3, 15);

      expect(service.getPagedStocks).toHaveBeenCalledWith(3, 15);
      expect(result).toEqual(mockPage);
    });
  });
});
