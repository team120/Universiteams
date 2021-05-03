import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InterestService } from "./interest.service";

@ApiTags('interests')
@Controller('interests')
export class InterestController {

    constructor(private interestService: InterestService) { }

    @Get()
    getInterests() {
        return this.interestService.findAll();
    }

    @Get(':id')
    getOneInterest() {
        return this.interestService.getOne();
    }
}
