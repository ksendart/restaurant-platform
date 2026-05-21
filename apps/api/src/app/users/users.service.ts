import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@restaurant-platform/shared-types';
import { User, UserDocument } from './user.schema';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  findByIdWithRefreshHash(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  create(input: CreateUserInput): Promise<UserDocument> {
    return this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role ?? 'customer',
    });
  }

  async setRefreshTokenHash(
    id: string,
    refreshTokenHash: string | null
  ): Promise<void> {
    await this.userModel
      .updateOne({ _id: id }, { $set: { refreshTokenHash } })
      .exec();
  }
}
