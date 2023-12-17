import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { Repository } from 'typeorm';
import { OrdersProductsEntity } from './entities/orders-products.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { ShippingEntity } from './entities/shipping.entity';
import { ProductsService } from 'src/products/products.service';
import { ProductEntity } from 'src/products/entities/product.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrdersProductsEntity)
    private readonly opRepository: Repository<OrdersProductsEntity>,
    private readonly productService: ProductsService,
  ) {}
  async create(
    createOrderDto: CreateOrderDto,
    user: UserEntity,
  ): Promise<OrderEntity> {
    const shippingEntity = new ShippingEntity();
    const orderEntity = new OrderEntity();

    Object.assign(shippingEntity, createOrderDto.shippingAddress);
    orderEntity.shippingAddress = shippingEntity;
    orderEntity.user = user;

    const newOrder = await this.orderRepository.save(orderEntity);

    const opEntity: {
      order: OrderEntity;
      product: ProductEntity;
      product_quantity: number;
      product_unit_price: number;
    }[] = [];

    for (
      let index = 0;
      index < createOrderDto.orderedProducts.length;
      index++
    ) {
      const order = newOrder;
      const product = await this.productService.findOne(
        createOrderDto.orderedProducts[index].id,
      );
      const product_quantity: number =
        createOrderDto.orderedProducts[index].product_quantity;
      const product_unit_price: number =
        createOrderDto.orderedProducts[index].product_unit_price;
      opEntity.push({
        order,
        product,
        product_quantity,
        product_unit_price,
      });

      const op = await this.opRepository
        .createQueryBuilder()
        .insert()
        .into(OrdersProductsEntity)
        .values(opEntity)
        .execute();
    }

    return await this.findOne(newOrder.id);
  }

  async findAll(): Promise<OrderEntity[]> {
    return await this.orderRepository.find({
      relations: {
        shippingAddress: true,
        user: true,
        products: true,
      },
    });
  }

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: {
        id,
      },
      relations: {
        shippingAddress: true,
        user: true,
        products: {
          product: true,
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderStatusDto,
    user: UserEntity,
  ) {
    let order = await this.findOne(id);
    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(`Order already ${order.status}`);
    }

    if (
      order.status === OrderStatus.PROCESSING &&
      updateOrderDto.status !== OrderStatus.SHIPPED
    ) {
      throw new BadRequestException(`Delivery before shipped? `);
    }

    if (
      order.status === OrderStatus.SHIPPED &&
      updateOrderDto.status === OrderStatus.SHIPPED
    ) {
      return order;
    }

    if (updateOrderDto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }
    order.status = updateOrderDto.status;
    order.updatedBy = user;
    order = await this.orderRepository.save(order);

    if (updateOrderDto.status === OrderStatus.DELIVERED) {
      await this.stockUpdate(order, updateOrderDto.status);
    }
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  private async stockUpdate(order: OrderEntity, status: string) {
    for await (const op of order.products) {
      await this.productService.updateStock(
        op.product.id,
        op.product_quantity,
        status,
      );
    }
  }
}
