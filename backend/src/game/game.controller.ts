import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GameService } from './services/game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
export class GameController {
  constructor(private gameService: GameService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 games per hour
  async createGame(@Body() createGameDto: CreateGameDto, @Request() req) {
    return this.gameService.createGame(createGameDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async getAvailableGames() {
    return this.gameService.getAvailableGames();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async getGame(@Param('id') id: string) {
    return this.gameService.getGame(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 joins per minute
  async joinGame(@Param('id') id: string, @Request() req) {
    return this.gameService.joinGame(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/leave')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 leaves per minute
  async leaveGame(@Param('id') id: string, @Request() req) {
    return this.gameService.leaveGame(id, req.user.id);
  }
}
