-- CreateTable
CREATE TABLE "EstoquePorLoja" (
    "idLoja" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL,
    "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("idLoja", "sku")
);

-- CreateTable
CREATE TABLE "EventoProcessado" (
    "idEvento" TEXT NOT NULL PRIMARY KEY,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "idx_estoque_sku" ON "EstoquePorLoja"("sku");
