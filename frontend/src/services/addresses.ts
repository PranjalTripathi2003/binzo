import { apiFetch } from './api';

/** A saved delivery address as returned by the backend. */
export type Address = {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
  created_at: string;
};

/** Payload for creating a new address. */
export type CreateAddressPayload = {
  label: string;
  address: string;
  is_default?: boolean;
};

/**
 * GET /api/addresses
 *
 * Returns all saved delivery addresses for the authenticated user,
 * ordered by default first then created_at ascending.
 */
export async function getAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>('/addresses');
}

/**
 * POST /api/addresses
 *
 * Creates a new delivery address for the authenticated user.
 */
export async function createAddress(
  payload: CreateAddressPayload,
): Promise<Address> {
  return apiFetch<Address>('/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/addresses/:id
 *
 * Removes one delivery address owned by the authenticated user.
 */
export async function deleteAddress(id: string): Promise<void> {
  await apiFetch<null>(`/addresses/${id}`, { method: 'DELETE' });
}
