import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExchangeRateService } from './exchange-rate.service';
import { GetRateQueryDto } from './dto/get-rate-query.dto';

@ApiTags('Exchange Rate')
@ApiBearerAuth('access-token')
@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
@ApiOperation({ summary: 'Get the current exchange rate between two currencies' })
async getRate(@Query() query: GetRateQueryDto) {
  const result = await this.exchangeRateService.getRate(query.from, query.to);
  return { from: query.from, to: query.to, ...result };
}
}