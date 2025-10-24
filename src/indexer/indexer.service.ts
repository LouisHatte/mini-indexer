import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

dotenv.config();

@Injectable()
export class IndexerService implements OnModuleInit {
  private prisma = new PrismaClient();
  private client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL),
  });

  private tokenAddress = process.env.TOKEN_ADDRESS as `0x${string}`;

  private transferAbi = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ]);

  onModuleInit() {
    console.log('Starting continuous indexer...');
    void this.runContinuousSync();
  }

  private async runContinuousSync() {
    const interval = Number(process.env.INDEXER_INTERVAL!);

    while (true) {
      try {
        await this.syncTransfers();
        console.log('Sync complete, sleeping for 1 hour...');
      } catch (err) {
        console.error(err);
        await new Promise((r) => setTimeout(r, interval));
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  private async getLastCheckpoint() {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: 1 },
    });
    return checkpoint
      ? BigInt(checkpoint.lastBlock)
      : BigInt(process.env.START_BLOCK!);
  }

  private async saveCheckpoint(block: bigint) {
    await this.prisma.checkpoint.upsert({
      where: { id: 1 },
      update: { lastBlock: block },
      create: { id: 1, lastBlock: block },
    });
  }

  async syncTransfers() {
    const fromBlock = await this.getLastCheckpoint();
    const latestBlock = await this.client.getBlockNumber();
    const safestBlock = latestBlock - BigInt(process.env.CONFIRMATION_BLOCK!);
    const step = BigInt(process.env.BATCH_SIZE!);
    let startBlock = fromBlock;
    console.log(`Syncing from ${fromBlock} to ${safestBlock}`);

    while (startBlock < safestBlock) {
      const endBlock =
        startBlock + step >= safestBlock ? safestBlock : startBlock + step;

      console.log(`Fetching logs from ${startBlock} to ${endBlock}`);

      try {
        const logs = await this.client.getLogs({
          address: this.tokenAddress,
          event: this.transferAbi[0],
          fromBlock: startBlock,
          toBlock: endBlock,
        });

        if (logs.length === 0) continue;

        for (const log of logs) {
          const { from, to, value } = log.args;
          if (!log.transactionHash) continue;

          await this.prisma.transfer.upsert({
            where: { txHash: log.transactionHash },
            update: {},
            create: {
              txHash: log.transactionHash,
              blockNumber: Number(log.blockNumber),
              from: (from ?? '').toString(),
              to: (to ?? '').toString(),
              value: value?.toString() ?? '0',
            },
          });
        }

        startBlock = endBlock + 1n;
        console.log(`Indexed ${logs.length} transfers`);
      } catch (err) {
        console.error(err);
        startBlock = endBlock + 1n;
        await new Promise((r) => setTimeout(r, 2000));
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    await this.saveCheckpoint(startBlock + 1n);
  }
}
