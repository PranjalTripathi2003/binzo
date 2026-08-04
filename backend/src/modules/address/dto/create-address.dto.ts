/**
 * Payload for POST /api/addresses.
 *
 * label    – human-readable name shown in the address book (e.g. "Home")
 * address  – full delivery address string
 * is_default – whether this should become the user's default address
 */
export class CreateAddressDto {
  label!: string;
  address!: string;
  is_default?: boolean;
}
