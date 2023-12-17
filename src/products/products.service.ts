import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UpdateCategoryDto } from 'src/categories/dto/update-category.dto';
import { OrderStatus } from 'src/orders/enums/order-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private categoryService: CategoriesService,
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

  async findAll(): Promise<ProductEntity[]> {
    return await this.productRepository.find({});
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

  remove(id: number) {
    return `This action removes a #${id} product`;
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
