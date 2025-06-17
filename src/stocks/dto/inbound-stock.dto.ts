import { IsInt, IsNotEmpty, IsOptional, IsISO8601, IsPositive } from 'class-validator';

export class InboundStockDto {
    @IsNotEmpty()
    @IsInt()
    @IsPositive()
    productId: number;

    @IsNotEmpty()
    @IsInt()
    @IsPositive()
    quantity: number;

    @IsOptional()
    @IsISO8601()
    expirationDate?: string;
}
