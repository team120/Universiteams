import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Type } from '../generic-type';

export interface MapperConfig {
  groups: string[];
}

@Injectable()
export class EntityMapperService {
  mapArray<T, R>(
    typeToMap: Type<R>,
    elements: Array<T>,
    configs?: MapperConfig,
  ): Array<R> {
    return elements.map((user) => plainToClass(typeToMap, user, configs));
  }

  mapValue<T, R>(typeToMap: Type<R>, element: T, configs?: MapperConfig): R {
    return plainToClass(typeToMap, element, configs);
  }
}
