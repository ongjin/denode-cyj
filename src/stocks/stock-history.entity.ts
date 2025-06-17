import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Stock } from './stock.entity';
import { StockHistoryType } from 'src/common/enums/stock-history.enum';

@Entity()
export class StockHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Stock, (stock) => stock.histories)
    stock: Stock;

    @Column({ type: 'enum', enum: StockHistoryType })
    type: StockHistoryType;

    @Column()
    quantity: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
