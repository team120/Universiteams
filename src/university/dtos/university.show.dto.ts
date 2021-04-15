import { Exclude, Expose } from "class-transformer";
import { DepartmentShowDto } from "src/department/dtos/department.show.dto";

@Exclude()
export class UniversityShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  departments: DepartmentShowDto;
}
