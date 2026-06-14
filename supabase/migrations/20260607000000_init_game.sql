-- CreateTable
CREATE TABLE IF NOT EXISTS "Game" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "availableDifficulties" TEXT[],
    "availableGameModes" TEXT[],

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
