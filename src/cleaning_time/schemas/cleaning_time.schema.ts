import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Base, BaseDocument } from '../../common/schemas/base.schema';

export type CleaningTimeDocument = CleaningTime & BaseDocument;

@Schema({ timestamps: true })
export class CleaningTime extends Base {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, min: 1, max: 480 })
  cleaningTime: number;

}

export const CleaningTimeSchema = SchemaFactory.createForClass(CleaningTime); 