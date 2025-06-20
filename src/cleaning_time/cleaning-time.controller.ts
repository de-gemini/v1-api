import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { CleaningTimeService } from './cleaning-time.service';
import { CreateCleaningTimeDto } from './dto/create-cleaning-time.dto';
import { UpdateCleaningTimeDto } from './dto/update-cleaning-time.dto';
import { QueryCleaningTimeDto } from './dto/query-cleaning-time.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

@ApiTags('Cleaning Times')
@Controller('cleaning-times')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CleaningTimeController {
  constructor(private readonly cleaningTimeService: CleaningTimeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cleaning time for a room type' })
  @ApiResponse({ status: 201, type: SuccessResponse })
  async create(@Body() createCleaningTimeDto: CreateCleaningTimeDto) {
    const created = await this.cleaningTimeService.createCleaningTime(createCleaningTimeDto);
    return success(created, 'Cleaning time created successfully', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cleaning times with optional filters' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async findAll(@Query() query: QueryCleaningTimeDto) {
    const result = await this.cleaningTimeService.findWithFilters(query);
    return success(result, 'Cleaning times fetched successfully');
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active cleaning times' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active cleaning times retrieved successfully'
  })
  async findAllActive() {
    const result = await this.cleaningTimeService.findAll();
    return success(result, 'Active cleaning times retrieved successfully');
  }

  @Get('room-types')
  @ApiOperation({ summary: 'Get simplified list of room types' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of room types retrieved successfully'
  })
  async getRoomTypes() {
    const result = await this.cleaningTimeService.getRoomTypes();
    return success(result, 'Room types retrieved successfully');
  }

  @Get('difficulty/:difficulty')
  @ApiOperation({ summary: 'Get cleaning times by difficulty level' })
  @ApiParam({ name: 'difficulty', enum: ['easy', 'medium', 'hard'] })
  @ApiResponse({ 
    status: 200, 
    description: 'List of cleaning times by difficulty retrieved successfully'
  })
  async findByDifficulty(@Param('difficulty') difficulty: string) {
    const result = await this.cleaningTimeService.findByDifficulty(difficulty);
    return success(result, 'Cleaning times by difficulty retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific cleaning time by ID' })
  @ApiParam({ name: 'id', description: 'Cleaning time ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cleaning time retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Cleaning time not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.cleaningTimeService.findOneById(id);
    return success(result, 'Cleaning time retrieved successfully');
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get a specific cleaning time by room name' })
  @ApiParam({ name: 'name', description: 'Room name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cleaning time retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Cleaning time not found' })
  async findByName(@Param('name') name: string) {
    const result = await this.cleaningTimeService.findByName(name);
    return success(result, 'Cleaning time retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cleaning time' })
  @ApiParam({ name: 'id', description: 'Cleaning time ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cleaning time updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Cleaning time not found' })
  @ApiResponse({ status: 409, description: 'Room type name conflict' })
  async update(
    @Param('id') id: string, 
    @Body() updateCleaningTimeDto: UpdateCleaningTimeDto
  ) {
    const result = await this.cleaningTimeService.updateCleaningTime(id, updateCleaningTimeDto);
    return success(result, 'Cleaning time updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cleaning time (soft delete)' })
  @ApiParam({ name: 'id', description: 'Cleaning time ID' })
  @ApiResponse({ 
    status: 204, 
    description: 'Cleaning time deleted successfully'
  })
  @ApiResponse({ status: 404, description: 'Cleaning time not found' })
  async remove(@Param('id') id: string) {
    const result = await this.cleaningTimeService.deleteCleaningTime(id);
    return success(result, 'Cleaning time deleted successfully', 204);
  }

  @Post('calculate-total')
  @ApiOperation({ summary: 'Calculate total cleaning time for multiple rooms' })
  @ApiResponse({ 
    status: 200, 
    description: 'Total time calculated successfully'
  })
  async calculateTotalTime(@Body() rooms: { name: string; quantity: number }[]) {
    const result = await this.cleaningTimeService.calculateTotalTime(rooms);
    return success(result, 'Total cleaning time calculated successfully');
  }
} 