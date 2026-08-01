import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Request body for creating a categories row.
 */
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
