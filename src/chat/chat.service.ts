import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, ChatMessage } from './schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>
  ) {}

  async createChat(userId: string, userEmail: string, userName: string, initialMessage: string): Promise<ChatDocument> {
    const chat = new this.chatModel({
      userId,
      userEmail,
      userName,
      messages: [{
        senderId: userId,
        senderName: userName,
        senderRole: 'user',
        message: initialMessage,
        timestamp: new Date()
      }],
      isResolved: false,
      lastMessageAt: new Date()
    });
    return await chat.save();
  }

  async getUserChat(userId: string): Promise<ChatDocument | null> {
    // First try to find an unresolved chat
    let chat = await this.chatModel.findOne({ userId, isResolved: false }).sort({ lastMessageAt: -1 });
    
    // If no unresolved chat found, get the most recent chat (resolved or not)
    if (!chat) {
      chat = await this.chatModel.findOne({ userId }).sort({ lastMessageAt: -1 });
    }
    
    return chat;
  }

  async getAllChats(): Promise<ChatDocument[]> {
    return await this.chatModel.find().sort({ lastMessageAt: -1 });
  }

  async getActiveChats(): Promise<ChatDocument[]> {
    return await this.chatModel.find({ isResolved: false }).sort({ lastMessageAt: -1 });
  }

  async addMessage(chatId: string, message: ChatMessage): Promise<ChatDocument | null> {
    return await this.chatModel.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: message },
        $set: { lastMessageAt: new Date() }
      },
      { new: true }
    );
  }

  async resolveChat(chatId: string): Promise<ChatDocument | null> {
    return await this.chatModel.findByIdAndUpdate(
      chatId,
      { isResolved: true },
      { new: true }
    );
  }

  async getChatById(chatId: string): Promise<ChatDocument | null> {
    return await this.chatModel.findById(chatId);
  }
} 