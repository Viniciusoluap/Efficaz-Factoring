import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/setup
 *
 * Cria o usuário admin e a configuração padrão se ainda não existirem.
 * Pode ser chamado uma única vez após o primeiro deploy.
 * Se o admin já existir, retorna mensagem informativa sem alterar dados.
 */
export async function GET() {
  try {
    const jaExiste = await prisma.usuario.findUnique({
      where: { email: 'admin@grupoefficaz.com.br' },
    });

    if (jaExiste) {
      return NextResponse.json({
        ok: true,
        mensagem: 'Sistema já configurado. Admin já existe.',
        login: 'admin@grupoefficaz.com.br',
      });
    }

    const senhaHash = await bcrypt.hash('Efficaz2024!', 10);

    await prisma.usuario.createMany({
      data: [
        {
          nome: 'Administrador',
          email: 'admin@grupoefficaz.com.br',
          senha: senhaHash,
          perfil: 'ADMIN',
        },
        {
          nome: 'Operador Padrão',
          email: 'operador@grupoefficaz.com.br',
          senha: senhaHash,
          perfil: 'OPERADOR',
        },
      ],
    });

    await prisma.configuracao.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        taxaMinimaFiscal: 0.5,
        aliquotaImposto: 15,
        nomeEmpresa: 'Efficaz Factoring',
        emailSistema: 'contato@grupoefficaz.com.br',
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: 'Sistema configurado com sucesso!',
      credenciais: {
        admin: { email: 'admin@grupoefficaz.com.br', senha: 'Efficaz2024!' },
        operador: { email: 'operador@grupoefficaz.com.br', senha: 'Efficaz2024!' },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, erro: err.message },
      { status: 500 }
    );
  }
}
