/*
  Warnings:

  - The primary key for the `EventoProcessado` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `idLoja` to the `EventoProcessado` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventoProcessado" (
    "idEvento" TEXT NOT NULL,
    "idLoja" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("idEvento", "idLoja")
);
INSERT INTO "new_EventoProcessado" ("criadoEm", "idEvento") SELECT "criadoEm", "idEvento" FROM "EventoProcessado";
DROP TABLE "EventoProcessado";
ALTER TABLE "new_EventoProcessado" RENAME TO "EventoProcessado";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
