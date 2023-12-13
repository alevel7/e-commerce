import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  Min,
  IsArray,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  title;

  @IsNotEmpty()
  @IsString()
  description;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock: number;

  @IsNotEmpty()
  @IsArray()
  image: string[];

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;
}
