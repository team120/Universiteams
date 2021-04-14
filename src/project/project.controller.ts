import { Controller, Get } from '@nestjs/common';

@Controller('projects')
export class ProjectController {
  @Get()
  getProjects() {
    return 'hello';
  }
}
