import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * TODO: Implement findAll()
   * Description: Fetch all products from the database, optionally filtering by categoryId.
   * Requirements:
   * 1. Query the 'products' table.
   * 2. Join the 'product_variants' table using Supabase's relation query syntax: `.select('*, product_variants(*)')`.
   *    (This fetches the product and its nested variants in a single call!)
   * 3. If categoryId is provided as an argument, filter using `.eq('category_id', categoryId)`.
   * 4. Handle any query errors by throwing an HttpException.
   */
  async findAll(categoryId?: string) {
    // YOUR CODE HERE (Hint: Look at category.service.ts for error handling pattern)
    return [];
  }

  /**
   * TODO: Implement findOne()
   * Description: Fetch a single product and its variants by the product's ID.
   * Requirements:
   * 1. Query the 'products' table.
   * 2. Select the product and its variants: `.select('*, product_variants(*)')`.
   * 3. Filter by ID: `.eq('id', id)`.
   * 4. Use `.single()` to get a single object instead of an array.
   * 5. If the product is not found (error code 'PGRST116'), throw a 404 NOT_FOUND exception.
   */
  async findOne(id: string) {
    // YOUR CODE HERE
    return null;
  }

  /**
   * TODO: Implement create()
   * Description: Create a new product along with its variants.
   * Requirements:
   * 1. Extract the product fields and the 'variants' array from 'createProductDto'.
   * 2. Insert the product data into the 'products' table using `.insert([productData]).select().single()`.
   * 3. Extract the generated product ID from the inserted product.
   * 4. Map over the 'variants' array to inject this new 'product_id' into each variant.
   * 5. Insert the modified variants array into the 'product_variants' table.
   * 6. Return the created product along with its variants.
   */
  async create(createProductDto: CreateProductDto) {
    // YOUR CODE HERE
    return null;
  }

  /**
   * TODO: Implement remove()
   * Description: Delete a product from the database by its ID.
   * Requirements:
   * 1. First verify if the product exists by calling `this.findOne(id)`.
   * 2. Delete the product from the 'products' table where 'id' matches.
   *    (Note: The database has `ON DELETE CASCADE` configured on foreign keys, 
   *    so related variants will be deleted automatically!)
   * 3. Return a success response.
   */
  async remove(id: string) {
    // YOUR CODE HERE
    return { success: true };
  }
}
