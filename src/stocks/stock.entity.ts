import { Product } from "src/products/product.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { StockHistory } from "./stock-history.entity";

@Entity()
export class Stock {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, (product) => product.stocks)
    product: Product;

    // 유통기한 없으면 null
    @Column({ type: 'date', nullable: true })
    expirationDate?: string;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @VersionColumn({ default: 0 })
    version: number

    @OneToMany(() => StockHistory, (history) => history.stock)
    histories: StockHistory[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
