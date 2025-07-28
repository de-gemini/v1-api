import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VisitorDocument = Visitor & Document;

@Schema({ timestamps: true })
export class Visitor {
  @Prop({ required: true })
  ip: string;

  @Prop()
  userAgent?: string;

  @Prop()
  sessionId?: string;

  @Prop()
  path?: string;
}

export const VisitorSchema = SchemaFactory.createForClass(Visitor);

// Add index for efficient querying
VisitorSchema.index({ sessionId: 1, path: 1, createdAt: 1 }); 