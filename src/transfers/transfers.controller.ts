import { Controller, Get, Query } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

@Controller('transfers')
export class TransfersController {
  @Get()
  async getTransfers(@Query('limit') limit = 20) {
    return prisma.transfer.findMany({
      orderBy: { blockNumber: 'desc' },
      take: Number(limit),
    });
  }
}
