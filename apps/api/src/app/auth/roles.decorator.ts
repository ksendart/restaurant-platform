import { Reflector } from '@nestjs/core';
import { UserRole } from '@restaurant-platform/shared-types';

export const Roles = Reflector.createDecorator<UserRole[]>();
