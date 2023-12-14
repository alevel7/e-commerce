import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetReviewsDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
