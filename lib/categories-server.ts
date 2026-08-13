import { prisma } from "./db";
import { DEFAULT_CATEGORIES } from "./categories";

/**
 * Ensures that the course_category table has default categories populated.
 */
export async function ensureDefaultCategories() {
  try {
    const count = await prisma.courseCategory.count();
    if (count > 0) return;

    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.courseCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          order: cat.order,
          isActive: true,
        },
      });
    }
  } catch (error) {
    console.warn("Failed to ensure default categories in DB:", error);
  }
}
