import { NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, getSessionUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const purchaseSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitCost: z.number().int().nonnegative(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  if (user.role !== "ADMIN") return forbidden();

  const purchases = await prisma.purchase.findMany({
    include: { product: { select: { name: true, size: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ purchases });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  if (user.role !== "ADMIN") return forbidden();

  const parsed = purchaseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid purchase payload" }, { status: 400 });
  }

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: parsed.data.productId } });
      if (!product) {
        throw new Error("Product not found");
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          quantity: product.quantity + parsed.data.quantity,
          purchasePrice: parsed.data.unitCost,
        },
      });

      return tx.purchase.create({
        data: {
          productId: product.id,
          quantity: parsed.data.quantity,
          unitCost: parsed.data.unitCost,
          totalCost: parsed.data.quantity * parsed.data.unitCost,
        },
      });
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create purchase" },
      { status: 400 },
    );
  }
}
