-- AlterEnum
ALTER TYPE "OsStatus" ADD VALUE 'BLOQUEADA';

-- CreateEnum
CREATE TYPE "RegistroCompraStatus" AS ENUM ('CRIADO', 'APROVADO_FORNECEDOR', 'RECUSADO_FORNECEDOR', 'CANCELADO', 'RECEBIDO');

-- CreateTable
CREATE TABLE "registros_compra" (
    "id" UUID NOT NULL,
    "insumo_id" UUID NOT NULL,
    "ordem_servico_id" UUID,
    "quantidade_solicitada" INTEGER NOT NULL,
    "status" "RegistroCompraStatus" NOT NULL DEFAULT 'CRIADO',
    "fornecedor_resposta_codigo" TEXT,
    "fornecedor_mensagem" TEXT,
    "fornecedor_payload" JSONB,
    "motivo_recusa" TEXT,
    "motivo_cancelamento" TEXT,
    "solicitado_por_id" UUID,
    "recebido_por_id" UUID,
    "nota_fiscal_numero" TEXT,
    "nota_fiscal_chave" TEXT,
    "nota_fiscal_arquivo_nome" TEXT,
    "nota_fiscal_arquivo_tipo" TEXT,
    "nota_fiscal_arquivo_tamanho" INTEGER,
    "nota_fiscal_arquivo_url" TEXT,
    "aprovado_em" TIMESTAMP(3),
    "recusado_em" TIMESTAMP(3),
    "cancelado_em" TIMESTAMP(3),
    "recebido_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_compra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_compra_insumo_id_idx" ON "registros_compra"("insumo_id");

-- CreateIndex
CREATE INDEX "registros_compra_ordem_servico_id_idx" ON "registros_compra"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "registros_compra_status_idx" ON "registros_compra"("status");

-- AddForeignKey
ALTER TABLE "registros_compra" ADD CONSTRAINT "registros_compra_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_compra" ADD CONSTRAINT "registros_compra_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_compra" ADD CONSTRAINT "registros_compra_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_compra" ADD CONSTRAINT "registros_compra_recebido_por_id_fkey" FOREIGN KEY ("recebido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
