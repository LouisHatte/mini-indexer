-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastBlock" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);
