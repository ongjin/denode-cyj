import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { Stock } from './stock.entity';
import { StockHistory } from './stock-history.entity';
import { Product } from '../products/product.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Stock, StockHistory, Product]),
    ],
    providers: [StocksService],
    controllers: [StocksController],
})
export class StocksModule { }
