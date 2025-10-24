import { Module } from '@nestjs/common';
import { IndexerService } from './indexer/indexer.service';
import { TransfersController } from './transfers/transfers.controller';

@Module({
  controllers: [TransfersController],
  providers: [IndexerService],
})
export class AppModule {}
