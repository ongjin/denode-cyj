import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
@ApiTags('Products')
@ApiBearerAuth()
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: '신규 제품 등록' })
    @ApiBody({
        schema: {
            example: {
                name: '물건1',
                description: '설명',
                sku: 'XYZ-12345'
            }
        }
    })
    create(@Body() body: { name: string, description: string, sku: string }) {
        return this.productsService.create(body.name, body.description, body.sku);
    }

    @Get()
    @ApiOperation({ summary: '전체 제품 목록 조회' })
    findAll() {
        return this.productsService.findAll();
    }
}
