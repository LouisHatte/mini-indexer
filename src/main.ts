import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IndexerService } from './indexer/indexer.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isIndexer = process.argv.includes('--indexer');

  if (isIndexer) {
    const indexer = app.get(IndexerService);
    await indexer.runOneSync();
    process.exit(0);
  }

  await app.listen(process.env.PORT!);
  console.log(`✅ API running on port: ${process.env.PORT!}`);
}

void bootstrap();
