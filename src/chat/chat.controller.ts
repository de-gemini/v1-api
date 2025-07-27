import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Req,
  Patch
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { success } from '../common/utils/response.util';

@ApiTags('Chat System')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get user chat' })
  @ApiResponse({ status: 200, description: 'Chat retrieved successfully' })
  async getUserChat(@Req() req: any) {
    console.log('getUserChat called for user:', req.user.id);
    const chat = await this.chatService.getUserChat(req.user.id);
    console.log('getUserChat result:', chat ? { id: chat._id, messagesCount: chat.messages.length } : 'No chat found');
    return success(chat, 'Chat retrieved successfully');
  }

  @Post('user/start')
  @ApiOperation({ summary: 'Start a new chat' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello, I need help with my booking' }
      },
      required: ['message']
    }
  })
  @ApiResponse({ status: 201, description: 'Chat started successfully' })
  async startChat(@Req() req: any, @Body() body: { message: string }) {
    const chat = await this.chatService.createChat(
      req.user.id,
      req.user.email,
      req.user.name || req.user.email,
      body.message
    );
    return success(chat, 'Chat started successfully', 201);
  }

  @Post('user/message')
  @ApiOperation({ summary: 'Send a message in user chat' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Thank you for your help' }
      },
      required: ['message']
    }
  })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendUserMessage(@Req() req: any, @Body() body: { message: string }) {
    console.log('sendUserMessage called with:', { userId: req.user.id, message: body.message });
    
    let chat = await this.chatService.getUserChat(req.user.id);
    console.log('Found existing chat:', chat ? chat._id : 'None');
    
    if (!chat) {
      // Create new chat if none exists
      console.log('Creating new chat...');
      chat = await this.chatService.createChat(
        req.user.id,
        req.user.email,
        req.user.name || req.user.email,
        body.message
      );
      console.log('New chat created:', chat._id);
    } else {
      // Add message to existing chat
      console.log('Adding message to existing chat:', chat._id);
      const newMessage = {
        senderId: req.user.id,
        senderName: req.user.name || req.user.email,
        senderRole: 'user' as const,
        message: body.message,
        timestamp: new Date()
      };
      chat = await this.chatService.addMessage(chat._id, newMessage);
          console.log('Message added, updated chat:', chat?._id);
  }
  
  if (chat) {
    console.log('Returning chat with messages count:', chat.messages.length);
    return success(chat, 'Message sent successfully');
  } else {
    console.error('Chat is null after adding message');
    throw new Error('Failed to process message');
  }
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all chats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chats retrieved successfully' })
  async getAllChats() {
    const chats = await this.chatService.getAllChats();
    return success(chats, 'Chats retrieved successfully');
  }

  @Get('admin/active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get active chats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Active chats retrieved successfully' })
  async getActiveChats() {
    const chats = await this.chatService.getActiveChats();
    return success(chats, 'Active chats retrieved successfully');
  }

  @Get('admin/unresolved-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get count of unresolved chats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Unresolved chat count retrieved successfully' })
  async getUnresolvedChatCount() {
    const count = await this.chatService.getUnresolvedChatCount();
    return success({ count }, 'Unresolved chat count retrieved successfully');
  }

  @Get('admin/:chatId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get specific chat (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chat retrieved successfully' })
  async getChatById(@Param('chatId') chatId: string) {
    const chat = await this.chatService.getChatById(chatId);
    return success(chat, 'Chat retrieved successfully');
  }

  @Post('admin/:chatId/message')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send admin message (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello, how can I help you?' }
      },
      required: ['message']
    }
  })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendAdminMessage(
    @Req() req: any,
    @Param('chatId') chatId: string,
    @Body() body: { message: string }
  ) {
    const newMessage = {
      senderId: req.user.id,
      senderName: req.user.name || 'Admin',
      senderRole: 'admin' as const,
      message: body.message,
      timestamp: new Date()
    };
    
    const chat = await this.chatService.addMessage(chatId, newMessage);
    return success(chat, 'Message sent successfully');
  }

  @Patch('admin/:chatId/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve chat (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chat resolved successfully' })
  async resolveChat(@Param('chatId') chatId: string) {
    const chat = await this.chatService.resolveChat(chatId);
    return success(chat, 'Chat resolved successfully');
  }
} 