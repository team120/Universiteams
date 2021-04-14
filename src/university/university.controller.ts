import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

@Controller('universities')
export class UniversityController {
  @Get()
  getUniversities() {
    return 'universities';
  }

  @Get(':id')
  getUniversity(@Param('id') universityId: number) {
    return universityId;
  }

  @Post()
  createUniversity() {}

  @Put(':id')
  updateUniversity(@Param('id') universityId: number) {}

  @Delete(':id')
  deleteUniversity(@Param('id') universityId: number) {}
}
