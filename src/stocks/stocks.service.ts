import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { DataSource, IsNull, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { StockHistory } from './stock-history.entity';
import { Product } from 'src/products/product.entity';
import { StockHistoryType } from 'src/common/enums/stock-history.enum';

@Injectable()
export class StocksService {
    constructor(
        @InjectRepository(Stock) private stockRepo: Repository<Stock>,
        @InjectRepository(StockHistory) private historyRepo: Repository<StockHistory>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        private dataSource: DataSource,
    ) { }

    async inbound(productId: number, quantity: number, expirationDate?: string) {
        // 상품 검색
        const product = await this.productRepo.findOneBy({ id: productId  });
        if (!product) {
            throw new NotFoundException('해당 상품을 찾을 수 없습니다.');
        }

        if (expirationDate && new Date(expirationDate) < new Date()) {
            throw new BadRequestException('유통기한이 지난 상품은 입고할 수 없습니다.');
        }

        return this.dataSource.transaction(async (manager) => {
            let stock = await manager.findOne(Stock, {
                where: { product: { id: productId }, expirationDate: expirationDate ?? IsNull() },
                relations: ['product'],
            });

            if (stock) {
                stock.quantity += quantity;
                await manager.save(stock);
            } else {
                const product = await manager.findOneOrFail(Product, { where: { id: productId } });
                stock = manager.create(Stock, {
                    product,
                    expirationDate,
                    quantity,
                });
                await manager.save(stock);
            }

            const history = manager.create(StockHistory, {
                stock,
                type: StockHistoryType.IN,
                quantity,
            });
            await manager.save(history);

            return stock;
        });
    }

    async outbound(productId: number, quantity: number) {
        // 상품 검색
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException('해당 상품을 찾을 수 없습니다.');
        }

        return this.dataSource.transaction(async (manager) => {
            // 가능한 재고 목록 조회
            const stocks = await manager.find(Stock, {
                where: [
                    // 만료일이 없는 재고
                    { product: { id: productId }, quantity: MoreThan(0), expirationDate: IsNull() },
                    // 만료일이 남아 있는 재고
                    { product: { id: productId }, quantity: MoreThan(0), expirationDate: MoreThanOrEqual(new Date()) },
                ],
                order: { expirationDate: 'ASC' },
                // relations: ['product'],
            });

            let remaining = quantity;
            for (const stock of stocks) {
                // 실제 감소는 낙관적 락을 적용해 버전 체크
                const used = Math.min(remaining, stock.quantity);

                let locked: Stock;
                try {
                    locked = await manager.findOneOrFail(Stock, {
                        where: { id: stock.id },
                        lock: { mode: 'optimistic', version: stock.version }
                    });
                } catch (e) {
                    throw new ConflictException('다른 프로세스에서 재고를 변경하여 작업을 다시 시도해야 합니다.');
                }

                // 수량 감소 및 저장
                locked.quantity -= used;
                await manager.save(locked);

                // 기록
                const history = manager.create(StockHistory, {
                    stock: locked,
                    type: StockHistoryType.OUT,
                    quantity: used,
                });
                await manager.save(history);

                remaining -= used;
                if (remaining === 0) break;
            }

            if (remaining > 0) {
                throw new BadRequestException('재고가 부족하거나 유통기한이 지난 재고만 존재합니다.');
            }

            return { success: true };
            // return stocks;
        });
    }

    async getHistory(productId: number) {
        return this.historyRepo.find({
            where: { stock: { product: { id: productId } } },
            relations: ['stock', 'stock.product'],
            order: { createdAt: 'DESC' },
        });
    }

    async getPagedStock(productId: number, page: number = 1, limit: number = 10): Promise<{ data: Stock[]; total: number }> {
        const [data, total] = await this.stockRepo.findAndCount({
            where: { product: { id: productId } },
            relations: ['product'],
            order: { expirationDate: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async getPagedStocks(page: number = 1, limit: number = 10): Promise<{ data: Stock[]; total: number }> {
        const [data, total] = await this.stockRepo.findAndCount({
            relations: ['product'],
            order: { expirationDate: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }
}