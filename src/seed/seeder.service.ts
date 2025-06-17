import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { Product } from 'src/products/product.entity';
import { Stock } from 'src/stocks/stock.entity';
import { StockHistory } from 'src/stocks/stock-history.entity';
import { StockHistoryType } from 'src/common/enums/stock-history.enum';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Product) private readonly productRepo: Repository<Product>,
        @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
        @InjectRepository(StockHistory) private readonly historyRepo: Repository<StockHistory>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedUsers();
        await this.seedProductsAndStocks();
    }

    private async seedUsers() {
        const count = await this.userRepo.count();
        if (count > 0) return;

        const emails = ['test@example.com', 'test1@example.com'];
        const names = ['test', 'test1'];
        const passwords = ['123456', '123456'];
        const users: User[] = [];

        for (let i = 0; i < emails.length; i++) {
            const user = this.userRepo.create({
                email: emails[i],
                name: names[i],
                password: await bcrypt.hash(passwords[i], 10),
            });
            users.push(user);
        }

        await this.userRepo.save(users);
        console.log('Seeded Users:', emails);
    }

    private async seedProductsAndStocks() {
        const prodCount = await this.productRepo.count();
        if (prodCount === 0) {
            const products: Product[] = [
                this.productRepo.create({ name: 'Product A', sku: 'SKU-A', description: 'Sample product A' }),
                this.productRepo.create({ name: 'Product B', sku: 'SKU-B', description: 'Sample product B' }),
            ];
            await this.productRepo.save(products);
            console.log('Seeded Products:', products.map(p => p.sku));
        }

        const products = await this.productRepo.find();
        const stockCount = await this.stockRepo.count();
        if (stockCount === 0) {
            const lots: Stock[] = [];
            for (const product of products) {
                const lot = this.stockRepo.create({
                    product,
                    quantity: 100,
                });
                lots.push(lot);
            }
            await this.stockRepo.save(lots);
            console.log('Seeded Stocks for Products:', products.map(p => p.sku));

            const histories: StockHistory[] = [];
            for (const lot of lots) {
                const history = this.historyRepo.create({
                    stock: lot,
                    type: StockHistoryType.IN,
                    quantity: lot.quantity,
                });
                histories.push(history);
            }
            await this.historyRepo.save(histories);
            console.log('Seeded StockHistory entries');
        }
    }
}