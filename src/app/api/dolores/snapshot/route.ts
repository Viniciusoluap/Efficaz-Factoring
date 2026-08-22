import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getTecnoSpeedStatus } from "../../../../lib/dolores/tecnospeed";

function authorized(request: NextRequest) {
  const expected = process.env.DOLORES_READ_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-dolores-token") === expected;
}

async function safeCount(query: Promise<number>) {
  try {
    return await query;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [clientes, fornecedores, titulos, operacoes, contratos, comunicacoes, solicitacoes, prorrogacoes] = await Promise.all([
    safeCount(prisma.cliente.count()),
    safeCount(prisma.fornecedor.count()),
    safeCount(prisma.titulo.count()),
    safeCount(prisma.operacao.count()),
    safeCount(prisma.contrato.count()),
    safeCount(prisma.comunicacao.count()),
    safeCount(prisma.solicitacaoCliente.count()),
    safeCount(prisma.prorrogacao.count()),
  ]);

  return NextResponse.json({
    source: {
      system: "efficaz_factoring",
      companyCode: "EFC",
      canonicalDatabase: "PostgreSQL: Efficaz Factoring",
      capturedAt: new Date().toISOString(),
      mode: "read_only",
    },
    domains: {
      clientes,
      fornecedores,
      titulos,
      operacoes,
      contratos,
      comunicacoes,
      solicitacoes,
      prorrogacoes,
    },
    providers: {
      tecnospeed: getTecnoSpeedStatus(),
    },
    protections: {
      sourceWriteBack: false,
      titleWriteBack: false,
      operationWriteBack: false,
      financialRulesTouched: false,
    },
  });
}
