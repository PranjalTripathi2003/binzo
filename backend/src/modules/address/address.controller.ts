import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';

type AuthenticatedRequest = { user: { userId: string } };

/**
 * HTTP layer for delivery address routes under /api/addresses.
 *
 * All routes require a valid JWT. The userId is extracted from the token so
 * addresses are always scoped to the logged-in user; clients never need to
 * supply a userId in the request body.
 */
@UseGuards(AuthGuard('jwt'))
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * GET /api/addresses
   * Returns all saved delivery addresses for the logged-in user.
   */
  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const data = await this.addressService.findAll(req.user.userId);
    return { success: true, data, message: 'Addresses retrieved successfully', timestamp: new Date().toISOString() };
  }

  /**
   * POST /api/addresses
   * Creates a new delivery address for the logged-in user.
   */
  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAddressDto) {
    const data = await this.addressService.create(req.user.userId, dto);
    return { success: true, data, message: 'Address created successfully', timestamp: new Date().toISOString() };
  }

  /**
   * DELETE /api/addresses/:id
   * Removes one address owned by the logged-in user.
   */
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.addressService.remove(req.user.userId, id);
    return { success: true, data: null, message: 'Address deleted successfully', timestamp: new Date().toISOString() };
  }
}
