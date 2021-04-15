import { Exclude, Expose, Transform, Type } from "class-transformer";
import { ProjectType } from "../project.entity";

@Exclude()
export class ProjectFindDto {
  @Expose()
  generalSearch: string;
  @Expose()
  type: ProjectType;
  @Expose()
  @Transform(({ value }) => value === "true")
  isDown: boolean;
  @Expose()
  departmentId: number;
  @Expose()
  universityId: number;
  @Expose()
  userId: number;
  @Expose()
  @Type(() => Date)
  dateFrom: Date;
  @Expose()
  sortBy: string;
  @Expose()
  @Transform(({ value }) => value === "true")
  inAscendingOrder: boolean;
}
