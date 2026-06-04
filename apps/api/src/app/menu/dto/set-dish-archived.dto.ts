import { IsBoolean } from 'class-validator';

export class SetDishArchivedDto {
  @IsBoolean()
  isArchived!: boolean;
}
