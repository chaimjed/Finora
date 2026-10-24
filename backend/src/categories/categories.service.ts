import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    type?: 'INCOME' | 'EXPENSE',
    status: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE',
    tree = false,
  ) {
    const list = await this.prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        ...(type && { type }),
        ...(status !== 'ALL' && { status }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    if (!tree) return list;

    const ids = new Set(list.map((c) => c.id));
    const childrenByParent = new Map<string, typeof list>();
    for (const c of list) {
      if (c.parentId && ids.has(c.parentId)) {
        const siblings = childrenByParent.get(c.parentId) ?? [];
        siblings.push(c);
        childrenByParent.set(c.parentId, siblings);
      }
    }

    return list
      .filter((c) => !c.parentId || !ids.has(c.parentId))
      .map((c) => ({ ...c, children: childrenByParent.get(c.id) ?? [] }));
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, OR: [{ userId: null }, { userId }] },
      include: { children: { where: { OR: [{ userId: null }, { userId }] } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    let type = dto.type;

    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, OR: [{ userId: null }, { userId }] },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
      if (parent.parentId) {
        throw new BadRequestException('Subcategories cannot have their own subcategories');
      }
      if (parent.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot add a subcategory to an archived category');
      }
      if (dto.type && dto.type !== parent.type) {
        throw new BadRequestException('Subcategory type must match its parent type');
      }
      type = parent.type;
    }

    const existing = await this.prisma.category.findFirst({
      where: { userId, parentId: dto.parentId ?? null, name: dto.name, type },
    });
    if (existing) {
      throw new ConflictException(
        dto.parentId
          ? 'This subcategory already exists under this category'
          : 'You already have a category with this name and type',
      );
    }

    return this.prisma.category.create({
      data: { userId, name: dto.name, type: type!, parentId: dto.parentId ?? null },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.getOwnedCustom(userId, id);

    if (dto.name && dto.name !== category.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          userId,
          parentId: category.parentId,
          type: category.type,
          name: dto.name,
          NOT: { id },
        },
      });
      if (duplicate) throw new ConflictException('A category with this name already exists here');
    }

    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async archive(userId: string, id: string) {
    await this.getOwnedCustom(userId, id);
    const [, updated] = await this.prisma.$transaction([
      this.prisma.category.updateMany({
        where: { parentId: id, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      }),
      this.prisma.category.update({ where: { id }, data: { status: 'ARCHIVED' } }),
    ]);
    return updated;
  }

  async restore(userId: string, id: string) {
    const category = await this.getOwnedCustom(userId, id);

    if (category.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: category.parentId } });
      if (parent?.status === 'ARCHIVED') {
        throw new ConflictException('Restore the parent category first');
      }
    }

    return this.prisma.category.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async remove(userId: string, id: string) {
    const category = await this.getOwnedCustom(userId, id);

    const [txCount, budgetCount, recurringCount, childCount] = await this.prisma.$transaction([
      this.prisma.transaction.count({ where: { categoryId: category.id } }),
      this.prisma.budget.count({ where: { categoryId: category.id } }),
      this.prisma.recurringTransaction.count({ where: { categoryId: category.id } }),
      this.prisma.category.count({ where: { parentId: category.id } }),
    ]);

    if (childCount > 0) {
      throw new ConflictException('This category has subcategories — remove or archive them first');
    }
    if (txCount > 0 || budgetCount > 0 || recurringCount > 0) {
      throw new ConflictException('This category is in use — archive it instead');
    }

    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('This category is in use — archive it instead');
      }
      throw e;
    }
    return { success: true };
  }

  private async getOwnedCustom(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId === null) {
      throw new ForbiddenException('System categories cannot be modified');
    }
    if (category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}