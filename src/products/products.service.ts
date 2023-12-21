import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { OrderStatus } from 'src/orders/enums/order-status.enum';
import dataSource from 'db/data-source';
import { ProductDto } from './dto/products.dto';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private categoryService: CategoriesService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orderService: OrdersService,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    user: UserEntity,
  ): Promise<ProductEntity> {
    const category = await this.categoryService.findOne(
      +createProductDto.categoryId,
    );
    if (!category) throw new NotFoundException('Category does not exists');
    const product = await this.productRepository.create(createProductDto);
    product.category = category;
    product.addedBy = user;
    return await this.productRepository.save(product);
  }

  async findAll(query: any): Promise<ProductDto> {
    let limit: number;
    if (query.limit) {
      limit = 4;
    } else {
      limit = query.limit;
    }
    const queryBuilder = dataSource
      .getRepository(ProductEntity)
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.reviews', 'review')
      .select([
        'product.*',
        'category.id',
        'category.title',
        'category.description',
      ])
      .addSelect([
        'COUNT(review.id) as reviewCount',
        'AVG(review.ratings)::numeric(10, 2) as avgRating',
      ])
      .groupBy('product.id, category.id');
    const totalProducts = await queryBuilder.getCount();

    if (query.search) {
      const search = query.search;
      queryBuilder.andWhere('product.title like :title', {
        title: `%${search}%`,
      });
    }
    if (query.category) {
      queryBuilder.andWhere('category.id=:id', { id: query.category });
    }
    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }
    if (query.minRating) {
      queryBuilder.andHaving('AVG(review.ratings) >= :minRating', {
        minRating: query.minRating,
      });
    }
    if (query.maxRating) {
      queryBuilder.andHaving('AVG(review.ratings) <= :maxRating', {
        maxRating: query.maxRating,
      });
    }
    if (query.offset) {
      queryBuilder.offset((query.page - 1) * limit);
    }
    queryBuilder.limit(limit);
    const products = await queryBuilder.getRawMany();
    return { products, totalProducts, limit };

    // return await this.productRepository.find({});
  }

  async findOne(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        addedBy: true,
        category: true,
      },
      select: {
        addedBy: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
        category: {
          id: true,
          title: true,
          description: true,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: number,
    updateProductDto: Partial<UpdateProductDto>,
    user: UserEntity,
  ): Promise<ProductEntity> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    product.addedBy = user;
    if (updateProductDto.categoryId) {
      const category = await this.categoryService.findOne(
        +updateProductDto.categoryId,
      );
      if (!category) throw new NotFoundException('Category does not exists');
      product.category = category;
    }
    return await this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    const order = await this.orderService.findOderByProductId(product.id);
    if (order) throw new BadRequestException('Product is in use');
    return this.productRepository.remove(product);
  }

  async updateStock(
    id: number,
    stock: number,
    status: string,
  ): Promise<ProductEntity> {
    const product = await this.findOne(id);
    if (status === OrderStatus.DELIVERED) {
      product.stock -= stock;
    } else {
      product.stock += stock;
    }
    return await this.productRepository.save(product);
  }
}
