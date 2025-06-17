import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seeder.service';
import { Product } from 'src/products/product.entity';
import { User } from 'src/users/user.entity';
import { Stock } from 'src/stocks/stock.entity';
import { StockHistory } from 'src/stocks/stock-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Product, User, Stock, StockHistory])],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }
