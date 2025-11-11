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
  async createGame(@Body() createGameDto: CreateGameDto, @Request() req) {
    return this.gameService.createGame(createGameDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAvailableGames() {
    return this.gameService.getAvailableGames();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getGame(@Param('id') id: string) {
    return this.gameService.getGame(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinGame(@Param('id') id: string, @Request() req) {
    return this.gameService.joinGame(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/leave')
  async leaveGame(@Param('id') id: string, @Request() req) {
    return this.gameService.leaveGame(id, req.user.id);
  }
}
