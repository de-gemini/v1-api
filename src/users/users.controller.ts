import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Body, 
  UseGuards,
  Query
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

@ApiTags('Users Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: SuccessResponse
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(@Query('role') role?: UserRole) {
    if (role === UserRole.ADMIN) {
      return await this.usersService.findAdmins();
    } else if (role === UserRole.USER) {
      return await this.usersService.findUsers();
    }
    const users = await this.usersService.find({ isActive: true });
    return success(users, 'Users fetched successfully');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: SuccessResponse
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...result } = user.toObject();
    return success(result, 'User fetched successfully');
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User activated successfully'
  })
  async activateUser(@Param('id') id: string) {
    const user = await this.usersService.activateUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...result } = user.toObject();
    return result;
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deactivated successfully'
  })
  async deactivateUser(@Param('id') id: string) {
    const user = await this.usersService.deactivateUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...result } = user.toObject();
    return result;
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { 
          type: 'string', 
          enum: Object.values(UserRole),
          example: UserRole.ADMIN
        }
      },
      required: ['role']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User role changed successfully'
  })
  async changeUserRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole }
  ) {
    const user = await this.usersService.changeUserRole(id, body.role);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...result } = user.toObject();
    return result;
  }
} 