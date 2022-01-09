import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('')
  @Redirect('api')
  @ApiExcludeEndpoint()
  redirectToSwaggerDoc() {
    return 'Redirecting to universiteams api docs';
  }
}
