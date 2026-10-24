import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const dbUrl = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ''),
  allowPublicKeyRetrieval: true,
})
const prisma = new PrismaClient({ adapter })

const PERMISSION_LABELS: Record<string, string> = {
  'users:read': 'View users',
  'users:edit': 'Edit users',
  'users:create': 'Create users',
  'users:delete': 'Delete users',
  'users:export': 'Export users',
  'audit:read': 'View activity log',
  'roles:manage': 'Manage roles and permissions',
}

const PERMISSIONS = Object.keys(PERMISSION_LABELS);
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: PERMISSIONS,
  USER: [],
}

const DEFAULT_CATEGORIES: { name: string; type: 'INCOME' | 'EXPENSE' }[] = [
  { name: 'Salary', type: 'INCOME' },
  { name: 'Freelance', type: 'INCOME' },
  { name: 'Investments', type: 'INCOME' },
  { name: 'Other Income', type: 'INCOME' },
  { name: 'Groceries', type: 'EXPENSE' },
  { name: 'Rent', type: 'EXPENSE' },
  { name: 'Utilities', type: 'EXPENSE' },
  { name: 'Transport', type: 'EXPENSE' },
  { name: 'Health', type: 'EXPENSE' },
  { name: 'Entertainment', type: 'EXPENSE' },
  { name: 'Shopping', type: 'EXPENSE' },
  { name: 'Other Expense', type: 'EXPENSE' },
];

async function main() {
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: { label: PERMISSION_LABELS[code] },
        create: { code, label: PERMISSION_LABELS[code] },
      }),
    ),
  )

  const permissionsByCode = Object.fromEntries(
    permissionRecords.map((p) => [p.code, p]),
  )

  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    })

    for (const code of permissionCodes) {
      const permission = permissionsByCode[code];
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
    }
  }

  console.log('Permissions and roles seeded')

  for (const [index, cat] of DEFAULT_CATEGORIES.entries()) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name: cat.name, type: cat.type },
    });
    if (!existing) {
      await prisma.category.create({
        data: { userId: null, name: cat.name, type: cat.type, sortOrder: index },
      });
    }
  }

  console.log('Default categories seeded')
  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })