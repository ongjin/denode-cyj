import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./product.entity";
import { Repository } from "typeorm";

@Injectable()
export class ProductsService {
    constructor(@InjectRepository(Product) private repo: Repository<Product>) { }

    async create(name: string, description: string, sku: string) {
        const product = this.repo.create({ name, description, sku });
        return this.repo.save(product);
    }

    async findAll() {
        return this.repo.find();
    }
}
