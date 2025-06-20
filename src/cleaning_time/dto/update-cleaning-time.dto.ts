import { PartialType } from '@nestjs/swagger';
import { CreateCleaningTimeDto } from './create-cleaning-time.dto';

export class UpdateCleaningTimeDto extends PartialType(CreateCleaningTimeDto) {} 