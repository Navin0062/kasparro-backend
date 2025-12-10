-- CreateTable
CREATE TABLE "raw_data" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_market_data" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceUsd" DECIMAL(20,8) NOT NULL,
    "marketCapUsd" DECIMAL(30,2) NOT NULL,
    "volume24h" DECIMAL(30,2) NOT NULL,
    "source" TEXT NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crypto_market_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crypto_market_data_symbol_source_idx" ON "crypto_market_data"("symbol", "source");
