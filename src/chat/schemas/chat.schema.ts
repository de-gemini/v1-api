import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Base, BaseDocument } from '../../common/schemas/base.schema';

export type ChatDocument = Chat & BaseDocument;

export interface ChatMessage {
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Chat extends Base {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ type: [Object], default: [] })
  messages: ChatMessage[];

  @Prop({ default: false })
  isResolved: boolean;

  @Prop()
  lastMessageAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat); 