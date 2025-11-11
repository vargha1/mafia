import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameStatus, GamePhase, GameMode } from '../entities/game.entity';
import { GamePlayer, PlayerRole } from '../entities/game-player.entity';
import { GameHistory } from '../entities/game-history.entity';
import { CreateGameDto } from '../dto/create-game.dto';
import { UserService } from '../../user/user.service';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    private userService: UserService,
  ) {}

  async createGame(createGameDto: CreateGameDto, userId: string) {
    const game = this.gameRepository.create({
      room_name: createGameDto.room_name,
      max_players: createGameDto.max_players,
      game_mode: createGameDto.game_mode,
      custom_roles: createGameDto.custom_roles || null,
      created_by: userId,
      current_players: 0,
    });

    await this.gameRepository.save(game);
    return game;
  }

  async getAvailableGames() {
    const games = await this.gameRepository.find({
      where: { status: GameStatus.WAITING },
      relations: ['creator', 'players', 'players.user'],
      order: { created_at: 'DESC' },
    });

    return games.map(game => ({
      ...game,
      players: game.players.map(p => ({
        id: p.id,
        username: p.user.username,
        is_ready: p.is_ready,
      })),
    }));
  }

  async getGame(gameId: string) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['players', 'players.user'],
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  async joinGame(gameId: string, userId: string) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game has already started');
    }

    if (game.current_players >= game.max_players) {
      throw new BadRequestException('Game is full');
    }

    // Check if player already joined
    const existingPlayer = await this.gamePlayerRepository.findOne({
      where: { game_id: gameId, user_id: userId },
    });

    if (existingPlayer) {
      throw new BadRequestException('Already joined this game');
    }

    const gamePlayer = this.gamePlayerRepository.create({
      game_id: gameId,
      user_id: userId,
    });

    await this.gamePlayerRepository.save(gamePlayer);

    game.current_players += 1;
    await this.gameRepository.save(game);

    return this.getGame(gameId);
  }

  async leaveGame(gameId: string, userId: string) {
    const player = await this.gamePlayerRepository.findOne({
      where: { game_id: gameId, user_id: userId },
    });

    if (!player) {
      throw new NotFoundException('Player not in this game');
    }

    await this.gamePlayerRepository.remove(player);

    const game = await this.getGame(gameId);
    game.current_players -= 1;

    if (game.current_players === 0) {
      // Delete empty game
      await this.gameRepository.remove(game);
    } else {
      await this.gameRepository.save(game);
    }
  }

  async toggleReady(gameId: string, userId: string) {
    const player = await this.gamePlayerRepository.findOne({
      where: { game_id: gameId, user_id: userId },
    });

    if (!player) {
      throw new NotFoundException('Player not in this game');
    }

    player.is_ready = !player.is_ready;
    await this.gamePlayerRepository.save(player);

    return player.is_ready;
  }

  async startGame(gameId: string) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game already started');
    }

    if (game.current_players < 4) {
      throw new BadRequestException('Need at least 4 players to start');
    }

    // Check if all players are ready
    const allReady = game.players.every(p => p.is_ready);
    if (!allReady) {
      throw new BadRequestException('All players must be ready');
    }

    // Assign roles
    await this.assignRoles(game);

    game.status = GameStatus.IN_PROGRESS;
    game.phase = GamePhase.NIGHT;
    game.day_number = 1;
    await this.gameRepository.save(game);

    return this.getGame(gameId);
  }

  private async assignRoles(game: Game) {
    const players = game.players;
    const totalPlayers = players.length;

    let roleConfig;

    if (game.game_mode === GameMode.SIMPLE) {
      // Simple: 1 Mafia per 4 players, 1 Detective, rest Citizens
      const mafiaCount = Math.floor(totalPlayers / 4);
      roleConfig = {
        mafia: mafiaCount,
        detective: 1,
        citizen: totalPlayers - mafiaCount - 1,
      };
    } else if (game.game_mode === GameMode.COMPLETE) {
      // Complete: 1 Mafia per 3 players, 1 Detective, 1 Doctor, rest Citizens
      const mafiaCount = Math.floor(totalPlayers / 3);
      roleConfig = {
        mafia: mafiaCount,
        detective: 1,
        doctor: 1,
        sniper: totalPlayers > 8 ? 1 : 0,
        citizen: totalPlayers - mafiaCount - 2 - (totalPlayers > 8 ? 1 : 0),
      };
    } else {
      // Custom
      roleConfig = game.custom_roles;
    }

    // Create role array
    const roles: PlayerRole[] = [];
    for (let i = 0; i < (roleConfig.mafia || 0); i++) {
      roles.push(PlayerRole.MAFIA);
    }
    for (let i = 0; i < (roleConfig.detective || 0); i++) {
      roles.push(PlayerRole.DETECTIVE);
    }
    for (let i = 0; i < (roleConfig.doctor || 0); i++) {
      roles.push(PlayerRole.DOCTOR);
    }
    for (let i = 0; i < (roleConfig.sniper || 0); i++) {
      roles.push(PlayerRole.SNIPER);
    }
    for (let i = 0; i < (roleConfig.citizen || 0); i++) {
      roles.push(PlayerRole.CITIZEN);
    }

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign to players
    for (let i = 0; i < players.length; i++) {
      players[i].role = roles[i];
      await this.gamePlayerRepository.save(players[i]);
    }
  }

  async vote(gameId: string, voterId: string, targetId: string) {
    // Use database transaction for atomic voting operation
    const queryRunner = this.gamePlayerRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the game row to prevent concurrent phase changes
      const game = await queryRunner.manager.findOne(Game, {
        where: { id: gameId },
        relations: ['players'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!game) {
        await queryRunner.rollbackTransaction();
        throw new NotFoundException('Game not found');
      }

      if (game.phase !== GamePhase.VOTING) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('Not in voting phase');
      }

      // Lock target player row for atomic vote increment
      const target = await queryRunner.manager.findOne(GamePlayer, {
        where: { id: targetId, game_id: gameId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!target) {
        await queryRunner.rollbackTransaction();
        throw new NotFoundException('Target player not found');
      }

      // Verify voter is in game and eligible to vote
      const voter = game.players.find(p => p.user_id === voterId);
      if (!voter) {
        await queryRunner.rollbackTransaction();
        throw new NotFoundException('Voter not found in game');
      }

      if (!voter.is_alive) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('Dead players cannot vote');
      }

      if (!target.is_alive) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('Cannot vote for dead player');
      }

      // Check if voter already voted (optional - depends on game rules)
      if (voter.has_voted) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('Player has already voted');
      }

      // Atomically increment vote count
      target.votes_received = (target.votes_received || 0) + 1;
      const updatedTarget = await queryRunner.manager.save(target);

      // Mark voter as having voted
      voter.has_voted = true;
      await queryRunner.manager.save(voter);

      // Add audit log entry for the vote (GameHistory entity doesn't have action field, so this was removed)
      // Note: GameHistory entity needs to be extended for proper audit logging

      await queryRunner.commitTransaction();

      return updatedTarget;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async eliminatePlayer(gameId: string, playerId: string) {
    const player = await this.gamePlayerRepository.findOne({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    player.is_alive = false;
    await this.gamePlayerRepository.save(player);

    // Check win condition
    return this.checkWinCondition(gameId);
  }

  async checkWinCondition(gameId: string) {
    const game = await this.getGame(gameId);
    const alivePlayers = game.players.filter(p => p.is_alive);
    
    const aliveMafia = alivePlayers.filter(p => p.role === PlayerRole.MAFIA).length;
    const aliveCitizens = alivePlayers.filter(p => p.role !== PlayerRole.MAFIA).length;

    if (aliveMafia === 0) {
      // Citizens win
      game.winner = 'citizen';
      game.status = GameStatus.FINISHED;
      game.phase = GamePhase.RESULT;
      await this.gameRepository.save(game);
      await this.endGame(game);
      return { winner: 'citizen', game };
    }

    if (aliveMafia >= aliveCitizens) {
      // Mafia wins
      game.winner = 'mafia';
      game.status = GameStatus.FINISHED;
      game.phase = GamePhase.RESULT;
      await this.gameRepository.save(game);
      await this.endGame(game);
      return { winner: 'mafia', game };
    }

    return { winner: null, game };
  }

  private async endGame(game: Game) {
    const isMafiaWin = game.winner === 'mafia';

    for (const player of game.players) {
      const won = (player.role === PlayerRole.MAFIA && isMafiaWin) || 
                   (player.role !== PlayerRole.MAFIA && !isMafiaWin);
      
      const xpEarned = won ? 100 : 50;

      // Save history
      const history = this.gameHistoryRepository.create({
        user_id: player.user_id,
        game_id: game.id,
        role: player.role,
        won,
        xp_earned: xpEarned,
        duration_minutes: Math.floor((new Date().getTime() - game.created_at.getTime()) / 60000),
      });
      await this.gameHistoryRepository.save(history);

      // Update user stats
      await this.userService.updateUserStats(player.user_id, won, xpEarned);
    }
  }

  async resetVotes(gameId: string) {
    // Use transaction for atomic vote reset
    const queryRunner = this.gamePlayerRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock all players in the game
      const players = await queryRunner.manager.find(GamePlayer, {
        where: { game_id: gameId },
        lock: { mode: 'pessimistic_write' },
      });

      // Reset all votes atomically
      for (const player of players) {
        player.votes_received = 0;
        player.has_voted = false;
        await queryRunner.manager.save(player);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async nextPhase(gameId: string) {
    const game = await this.getGame(gameId);

    switch (game.phase) {
      case GamePhase.NIGHT:
        game.phase = GamePhase.DAY;
        break;
      case GamePhase.DAY:
        game.phase = GamePhase.VOTING;
        break;
      case GamePhase.VOTING:
        game.phase = GamePhase.NIGHT;
        game.day_number += 1;
        await this.resetVotes(gameId);
        break;
    }

    await this.gameRepository.save(game);
    return game;
  }

  async getPlayerRole(gameId: string, userId: string): Promise<PlayerRole> {
    const player = await this.gamePlayerRepository.findOne({
      where: { game_id: gameId, user_id: userId },
    });

    return player?.role;
  }
}
