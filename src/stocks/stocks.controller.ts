import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StocksService } from './stocks.service';
import { InboundStockDto } from './dto/inbound-stock.dto';
import { OutboundStockDto } from './dto/outbound-stock.dto';

@Controller('stocks')
@ApiBearerAuth()
@ApiTags('Stocks')
@UseGuards(AuthGuard('jwt'))
export class StocksController {
    constructor(private readonly stocksService: StocksService) { }

    @Post('in')
    @ApiOperation({ summary: '재고 입고 처리' })
    @ApiBody({
        schema: {
            example: {
                productId: 1,
                quantity: 3,
                expirationDate: new Date().toISOString().slice(0, 10),
            },
        },
    })
    inbound(@Body() body: InboundStockDto) {
        return this.stocksService.inbound(
            body.productId,
            body.quantity,
            body.expirationDate,
        );
    }

    @Post('out')
    @ApiOperation({ summary: '재고 출고 처리' })
    @ApiBody({
        schema: {
            example: {
                productId: 1,
                quantity: 3,
            },
        },
    })
    outbound(@Body() body: OutboundStockDto) {
        return this.stocksService.outbound(body.productId, body.quantity);
    }

    @Get('history')
    @ApiOperation({ summary: '입출고 이력 조회' })
    @ApiQuery({ name: 'productId', required: true, type: 'number', default: 1 })
    getHistory(@Query('productId') productId: number) {
        return this.stocksService.getHistory(productId);
    }

    @Get()
    @ApiOperation({ summary: '재고 목록 페이징 조회' })
    @ApiQuery({ name: 'productId', required: true, type: 'number', default: 1 })
    @ApiQuery({ name: 'page', required: false, type: 'number', default: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', default: 10 })
    getStock(@Query('productId') productId: number, @Query('page') page: number, @Query('limit') limit: number) {
        return this.stocksService.getPagedStock(productId, Number(page) || 1, Number(limit) || 10);
    }

    @Get('all')
    @ApiOperation({ summary: '전체 재고 페이징 조회' })
    @ApiQuery({ name: 'page', required: false, type: 'number', default: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', default: 10 })
    getStocks(@Query('page') page: number, @Query('limit') limit: number) {
        return this.stocksService.getPagedStocks(Number(page) || 1, Number(limit) || 10);
    }
}
