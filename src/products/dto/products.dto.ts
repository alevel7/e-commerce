import { Expose, Transform, Type } from 'class-transformer';

export class ProductList {
  @Expose({ name: 'id' })
  id: number;
  @Expose({ name: 'title' })
  product_title: string;
  @Expose({ name: 'image' })
  @Transform(({ value }) => value.toString().split(','))
  images: string[];
  @Expose()
  @Transform(({ obj }) => ({ id: obj.category_id, title: obj.category_title }))
  category: any;
}

export class ProductDto {
  @Expose()
  totalProducts: number;

  @Expose()
  limit: number;

  @Expose()
  @Type(() => ProductList)
  products: any;
}
