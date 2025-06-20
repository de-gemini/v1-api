import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PostcodeDto } from './dto/postcode.dto';
import { matchSupportedArea } from './utils/postcode.util';

@ApiTags('Postcode')
@Controller('postcode')
export class PostcodeController {
  @Post()
  @ApiOperation({ summary: 'Check if a postcode matches a supported area' })
  @ApiResponse({ status: 200, description: 'Area match result', schema: { example: { postcode: 'PE1 1AA', area: 'Peterborough' } } })
  checkPostcode(@Body() dto: PostcodeDto) {
    const area = matchSupportedArea(dto.postcode);
    return { postcode: dto.postcode, area };
  }
} 