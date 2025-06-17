import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { StockHistory } from './stock-history.entity';
import { Product } from 'src/products/product.entity';
import { StockHistoryType } from 'src/common/enums/stock-history.enum';
import { Repository, DataSource, ObjectLiteral } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = <T extends ObjectLiteral = ObjectLiteral>(): MockRepository<T> => ({
    count: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
});

describe('StocksService 테스트', () => {
    let service: StocksService;
    let stockRepo: MockRepository<Stock>;
    let historyRepo: MockRepository<StockHistory>;
    let productRepo: MockRepository<Product>;
    let dataSource: DataSource;

    beforeEach(async () => {
        stockRepo = createMockRepo<Stock>();
        historyRepo = createMockRepo<StockHistory>();
        productRepo = createMockRepo<Product>();

        // 트랜잭션 동작 목(mock) 구현: manager 역할을 하는 객체 반환
        dataSource = {
            transaction: jest.fn().mockImplementation(async (fn) => fn({
                findOne: stockRepo.findOne!,
                findOneOrFail: stockRepo.findOneOrFail!,
                find: stockRepo.find!,
                save: stockRepo.save!,
                create: jest.fn((entity, dto) => dto),
            } as any)),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StocksService,
                { provide: getRepositoryToken(Stock), useValue: stockRepo },
                { provide: getRepositoryToken(StockHistory), useValue: historyRepo },
                { provide: getRepositoryToken(Product), useValue: productRepo },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<StocksService>(StocksService);
    });

    describe('입고(inbound) 메서드', () => {
        beforeEach(() => {
            // 상품이 존재한다고 가정
            productRepo.findOneBy!.mockResolvedValue({ id: 1 } as Product);
        });

        it('신규 재고가 없을 때 재고와 이력 생성', async () => {
            // findOne으로 재고 조회 시 null 반환 (신규)
            stockRepo.findOne!.mockResolvedValue(null);
            // save 호출 시 저장된 객체 반환
            stockRepo.save!.mockResolvedValue({ id: 1, quantity: 5 });

            const result = await service.inbound(1, 5);

            // 상품 존재 검증 호출 확인
            expect(productRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
            // save가 재고 + 히스토리 총 2회 호출
            expect(stockRepo.save).toHaveBeenCalledTimes(2);

            const [stockCall, historyCall] = stockRepo.save!.mock.calls;
            // 첫 번째 save: 재고(quantity) 생성 검증
            expect(stockCall[0]).toEqual(
                expect.objectContaining({ quantity: 5 }),
            );
            // 두 번째 save: history(type, quantity) 생성 검증
            expect(historyCall[0]).toEqual(
                expect.objectContaining({ type: StockHistoryType.IN, quantity: 5 }),
            );
            // 반환값 검증: quantity 포함
            expect(result).toEqual(
                expect.objectContaining({ quantity: 5 }),
            );
        });

        it('유통기한이 지난 날짜로 입고 시 BadRequestException 발생', async () => {
            // 만료된 날짜 입력
            await expect(
                service.inbound(1, 10, '2000-01-01'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('출고(outbound) 메서드', () => {
        beforeEach(() => {
            // 상품 존재 검증 통과
            productRepo.findOne!.mockResolvedValue({ id: 1 } as Product);
        });

        it('낙관적 락 옵션을 사용하여 findOneOrFail 호출', async () => {
            // 재고 목록 목(mock)
            const stockItems: Stock[] = [{ id: 1, quantity: 5, version: 2 } as Stock];
            stockRepo.find!.mockResolvedValue(stockItems);
            stockRepo.findOneOrFail!.mockResolvedValue(stockItems[0]);
            stockRepo.save!.mockResolvedValue({});

            await service.outbound(1, 1);

            // 상품 존재 검증 호출 확인
            expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            // 낙관적 락 옵션 검증
            expect(stockRepo.findOneOrFail).toHaveBeenCalledWith(
                Stock,
                expect.objectContaining({
                    where: { id: 1 },
                    lock: { mode: 'optimistic', version: 2 },
                }),
            );
        });

        it('재고 차감 및 이력 생성 시 save 호출 횟수 검증', async () => {
            productRepo.findOne!.mockResolvedValue({ id: 1 } as Product);
            const stockItems: Stock[] = [
                { id: 1, quantity: 3, version: 1 } as Stock,
                { id: 2, quantity: 5, version: 1 } as Stock,
            ];
            stockRepo.find!.mockResolvedValue(stockItems);
            stockRepo.findOneOrFail!.mockResolvedValue(stockItems[0]);
            stockRepo.save!.mockResolvedValue({});

            const result = await service.outbound(1, 4);

            // findOneOrFail 통한 낙관적 락 검증 2회 호출
            expect(stockRepo.findOneOrFail).toHaveBeenCalledTimes(2);
            // save 호출 4회 (2회 재고 차감 + 2회 이력 생성)
            expect(stockRepo.save).toHaveBeenCalledTimes(4);
            // 최종 반환값 검증
            expect(result).toEqual({ success: true });
        });

        it('재고 부족 시 BadRequestException 발생', async () => {
            productRepo.findOne!.mockResolvedValue({ id: 1 } as Product);
            stockRepo.find!.mockResolvedValue([{ id: 1, quantity: 2, version: 1 } as Stock]);
            stockRepo.findOneOrFail!.mockResolvedValue({ id: 1, quantity: 2, version: 1 } as Stock);

            await expect(service.outbound(1, 5)).rejects.toThrow(BadRequestException);
        });

        it('낙관적 락 버전 불일치 시 ConflictException 발생', async () => {
            productRepo.findOne!.mockResolvedValue({ id: 1 } as Product);
            stockRepo.find!.mockResolvedValue([{ id: 1, quantity: 5, version: 1 } as Stock]);
            stockRepo.findOneOrFail!.mockRejectedValue(new Error());

            await expect(service.outbound(1, 3)).rejects.toThrow(ConflictException);
        });
    });
});