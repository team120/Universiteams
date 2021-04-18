import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

export interface MapperConfig {
  groups: string[];
}

@Injectable()
export class EntityMapperService {
  mapArray<T, R>(
    typeToMap: { new (...args: any[]): R },
    elements: Array<T>,
    configs?: MapperConfig,
  ): Array<R> {
    return elements.map((user) => plainToClass(typeToMap, user, configs));
  }

  mapValue<T, R>(
    typeToMap: { new (...args: any[]): R },
    element: T,
    configs?: MapperConfig,
  ) {
    return plainToClass(typeToMap, element, configs);
  }
}
