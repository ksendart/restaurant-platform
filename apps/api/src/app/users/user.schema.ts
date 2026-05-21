import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { USER_ROLES, UserRole } from '@restaurant-platform/shared-types';

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({
    type: String,
    required: true,
    enum: USER_ROLES,
    default: 'customer',
  })
  role!: UserRole;

  @Prop({ trim: true })
  name?: string;

  @Prop({ select: false })
  refreshTokenHash?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
