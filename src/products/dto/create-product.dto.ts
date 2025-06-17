import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    name: string;
    
    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsString()
    @Length(3, 50, { message: 'SKU는 3자 이상 50자 이하이어야 합니다.' })
    sku: string;
}
