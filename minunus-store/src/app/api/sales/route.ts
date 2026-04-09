import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const saleSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const sales = await prisma.sale.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: {
      user: { select: { username: true } },
      product: { select: { name: true, size: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sales });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const parsed = saleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sale payload" }, { status: 400 });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: parsed.data.productId } });
      if (!product) {
        throw new Error("Product not found");
      }
      if (product.quantity < parsed.data.quantity) {
        throw new Error("Insufficient stock");
      }

      await tx.product.update({
        where: { id: product.id },
        data: { quantity: product.quantity - parsed.data.quantity },
      });

      return tx.sale.create({
        data: {
          productId: product.id,
          userId: user.id,
          quantity: parsed.data.quantity,
          unitPrice: product.sellingPrice,
          totalPrice: product.sellingPrice * parsed.data.quantity,
        },
      });
    });

    return NextResponse.json({ sale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create sale" },
      { status: 400 },
    );
  }
}
