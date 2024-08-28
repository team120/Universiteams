import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { InterestService } from './interest.service';
import { AppValidationPipe } from '../utils/validation.pipe';
import { InterestFindDto } from './dtos/interest.find.dto';
import { IsAdminGuard } from '../auth/is.admin.guard';
import { IsAuthGuard } from '../auth/is-auth.guard';
import { InterestCreateDto } from './dtos/interest.create.dto';

@ApiTags('interests')
@Controller('interests')
export class InterestController {
  constructor(private interestService: InterestService) {}

  @Get()
  async get(@Query(AppValidationPipe) findOptions: InterestFindDto) {
    return this.interestService.find(findOptions);
  }
  @UseGuards(...IsAdminGuard)
  @ApiCookieAuth()
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.interestService.delete(id);
  }

  @UseGuards(IsAuthGuard)
  @ApiCookieAuth()
  @Post()
  async create(@Body() interest: InterestCreateDto) {
    return this.interestService.create(interest);
  }
}
