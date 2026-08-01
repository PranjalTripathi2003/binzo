import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Request body for POST /api/auth/login.
 *
 * ValidationPipe reads these decorators before AuthService checks the database.
 */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
