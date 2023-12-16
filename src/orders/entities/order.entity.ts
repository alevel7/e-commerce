import {
  CreateDateColumn,
  Entity,
  Timestamp,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { UserEntity } from 'src/users/entities/user.entity';
import { ShippingEntity } from './shipping.entity';
import { OrdersProductsEntity } from './orders-products.entity';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Timestamp;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PROCESSING })
  status: string;

  @Column({ nullable: true })
  shippedAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.ordersUpdatedBy)
  updatedBy: UserEntity;

  @OneToOne(() => ShippingEntity, (shipping) => shipping.order, {
    cascade: true,
  })
  @JoinColumn()
  shippingAddress: ShippingEntity;

  @OneToMany(() => OrdersProductsEntity, (op) => op.product)
  products: OrdersProductsEntity[];
}
