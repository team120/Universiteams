import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('')
  @Redirect('api')
  redirectToSwaggerDoc() {
    return 'Redirecting to universiteams api docs';
  }
}
