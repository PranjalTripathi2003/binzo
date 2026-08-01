import { IsOptional, IsString } from 'class-validator';

/**
 * Request body for partially updating a categories row.
 *
 * Every field is optional because PATCH can update one field at a time.
 */
export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
