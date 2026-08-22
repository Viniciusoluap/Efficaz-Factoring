import { NextRequest, NextResponse } from "next/server";
import { getTecnoSpeedStatus } from "../../../../lib/dolores/tecnospeed";

function authorized(request: NextRequest) {
  const expected = process.env.DOLORES_READ_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-dolores-token") === expected;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  return NextResponse.json({
    center: "Centro de Operações da Dolores 9A",
    sourceSystem: "efficaz_factoring",
    companyCode: "EFC",
    canonicalDatabase: "PostgreSQL: Efficaz Factoring",
    mode: "read_only",
    sourceWriteBack: false,
    financialRulesTouched: false,
    providers: {
      tecnospeed: getTecnoSpeedStatus(),
    },
  });
}
