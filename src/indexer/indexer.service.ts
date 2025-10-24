import { Injectable } from '@nestjs/common';
import { PrismaClient, Transfer } from '@prisma/client';
import * as dotenv from 'dotenv';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

dotenv.config();

@Injectable()
export class IndexerService {
  private prisma = new PrismaClient();
  private client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL),
  });

  private tokenAddress = process.env.TOKEN_ADDRESS as `0x${string}`;

  private transferAbi = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ]);

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

  private async saveTransfer(transfer: Omit<Transfer, 'id' | 'createdAt'>) {
    const { txHash, blockNumber, from, to, value } = transfer;
    await this.prisma.transfer.upsert({
      where: { txHash },
      update: {},
      create: { txHash, blockNumber, from, to, value },
    });
  }

  async runOneSync() {
    console.log('⚙️​ Indexing starting');

    try {
      const fromBlock = await this.getLastCheckpoint();
      const latestBlock = await this.client.getBlockNumber();
      const safestBlock = latestBlock - BigInt(process.env.CONFIRMATION_BLOCK!);

      console.log(`🔸 Syncing from ${fromBlock} to ${safestBlock}`);
      await this.syncTransfers(fromBlock, safestBlock);
      console.log(`🔸 Saving checkpoint ${safestBlock + 1n}`);
      await this.saveCheckpoint(safestBlock + 1n);
    } catch (err) {
      console.error('❌ Indexing error', err);
      return;
    }

    console.log('✅ Indexing complete');
  }

  private async syncTransfers(firstBlock: bigint, lastBlock: bigint) {
    const step = BigInt(process.env.BATCH_SIZE!);

    for (let from = firstBlock; from <= lastBlock; from = from + step + 1n) {
      const to = from + step >= lastBlock ? lastBlock : from + step;
      console.log(`🔹 Syncing from ${from} to ${to}`);

      const logs = await this.client.getLogs({
        address: this.tokenAddress,
        event: this.transferAbi[0],
        fromBlock: from,
        toBlock: to,
      });

      if (logs.length === 0) continue;

      for (const log of logs) {
        if (!log.transactionHash) continue;

        await this.saveTransfer({
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          from: (log.args.from ?? '').toString(),
          to: (log.args.to ?? '').toString(),
          value: log.args.value?.toString() ?? '0',
        });
      }

      console.log(`🔹 ${logs.length} transfers indexed`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
