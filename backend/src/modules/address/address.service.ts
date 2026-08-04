import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAddressDto } from './dto/create-address.dto';

type SupabaseQueryResult<T> = {
  data: T | null;
  error: { code?: string; message: string } | null;
};

/**
 * Database logic for the `addresses` table.
 *
 * All reads and writes are scoped to the authenticated user's userId so a user
 * can never read or modify another user's addresses.
 *
 * Table: addresses
 *   id         uuid PK
 *   user_id    uuid FK → users.id
 *   label      text  (e.g. "Home", "Work")
 *   address    text  (full address string)
 *   is_default boolean
 *   created_at timestamptz
 */
@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Returns all saved delivery addresses for the given user, ordered by
   * is_default DESC then created_at ASC so the default address always appears
   * first.
   */
  async findAll(userId: string): Promise<unknown> {
    const response = (await this.supabaseService
      .getClient()
      .from('addresses')
      .select('id, label, address, is_default, created_at')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })) as SupabaseQueryResult<unknown[]>;

    if (response.error) {
      this.logger.error(`Error fetching addresses for user ${userId}: ${response.error.message}`);
      throw new HttpException(response.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return response.data ?? [];
  }

  /**
   * Inserts a new address for the authenticated user.
   * If is_default is true, clears the default flag on all other addresses first
   * to ensure only one default exists at a time.
   */
  async create(userId: string, dto: CreateAddressDto): Promise<unknown> {
    if (dto.is_default) {
      await this.clearDefaultFlag(userId);
    }

    const response = (await this.supabaseService
      .getClient()
      .from('addresses')
      .insert([{ user_id: userId, label: dto.label, address: dto.address, is_default: dto.is_default ?? false }])
      .select('id, label, address, is_default, created_at')
      .single()) as SupabaseQueryResult<unknown>;

    if (response.error) {
      this.logger.error(`Error creating address for user ${userId}: ${response.error.message}`);
      throw new HttpException(response.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return response.data;
  }

  /**
   * Deletes one address owned by the authenticated user.
   * Filtering by both id and user_id prevents deleting another user's address.
   */
  async remove(userId: string, addressId: string): Promise<void> {
    const response = (await this.supabaseService
      .getClient()
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)) as SupabaseQueryResult<unknown>;

    if (response.error) {
      this.logger.error(`Error deleting address ${addressId}: ${response.error.message}`);
      throw new HttpException(response.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Removes the is_default flag from all addresses owned by the user.
   * Called before setting a new default to ensure uniqueness.
   */
  private async clearDefaultFlag(userId: string): Promise<void> {
    await this.supabaseService
      .getClient()
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
  }
}
