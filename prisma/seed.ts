import { PrismaClient, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  const senhaHash = await bcrypt.hash('Efficaz2024!', 10);

  // Admin padrão
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@grupoefficaz.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@grupoefficaz.com.br',
      senha: senhaHash,
      perfil: Perfil.ADMIN,
    },
  });

  // Operador padrão
  await prisma.usuario.upsert({
    where: { email: 'operador@grupoefficaz.com.br' },
    update: {},
    create: {
      nome: 'Operador Padrão',
      email: 'operador@grupoefficaz.com.br',
      senha: senhaHash,
      perfil: Perfil.OPERADOR,
    },
  });

  // Configuração padrão
  await prisma.configuracao.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      taxaMinimaFiscal: 0.5,
      aliquotaImposto: 7,
      nomeEmpresa: 'Efficaz Factoring',
      emailSistema: 'contato@grupoefficaz.com.br',
    },
  });

  console.log('Seed concluído!');
  console.log('Admin:', admin.email, '| Senha: Efficaz2024!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
