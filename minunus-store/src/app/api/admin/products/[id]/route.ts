import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, getSessionUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const parsed = z.coerce.number().int().positive().safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const productId = parsed.data;

  const [saleCount, purchaseCount, product] = await Promise.all([
    prisma.sale.count({ where: { productId } }),
    prisma.purchase.count({ where: { productId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (saleCount > 0 || purchaseCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete product with existing sales or purchases" },
      { status: 400 },
    );
  }

  await prisma.product.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}

