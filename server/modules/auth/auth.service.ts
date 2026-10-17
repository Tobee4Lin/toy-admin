import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from 'bcryptjs';
import { admin } from '../../database/sqlite-schema';
import { eq } from 'drizzle-orm';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import { Inject } from '@nestjs/common';

export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<{ id: number; username: string } | null> {
    const user = await this.db
      .select()
      .from(admin)
      .where(eq(admin.username, username))
      .get();

    if (!user) return null;
    if (!compareSync(password, user.passwordHash)) return null;

    return { id: user.id, username: user.username };
  }

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload: JwtPayload = { sub: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async findById(id: number): Promise<{ id: number; username: string } | null> {
    const user = await this.db
      .select({ id: admin.id, username: admin.username })
      .from(admin)
      .where(eq(admin.id, id))
      .get();
    return user ?? null;
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const user = await this.db
      .select()
      .from(admin)
      .where(eq(admin.id, userId))
      .get();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!compareSync(oldPassword, user.passwordHash)) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.db
      .update(admin)
      .set({ passwordHash: hashSync(newPassword, 10) })
      .where(eq(admin.id, userId));

    return { success: true };
  }
}
