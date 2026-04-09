import { NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, getSessionUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1),
  size: z.string().min(1),
  sellingPrice: z.number().int().nonnegative(),
  purchasePrice: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
});

const updateSchema = z.object({
  productId: z.number().int().positive(),
  sellingPrice: z.number().int().nonnegative().optional(),
  purchasePrice: z.number().int().nonnegative().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        size: parsed.data.size,
        sellingPrice: parsed.data.sellingPrice,
        purchasePrice: parsed.data.purchasePrice ?? 0,
        quantity: parsed.data.quantity ?? 0,
      },
    });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Could not create product (maybe name+size already exists)" },
      { status: 409 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  const { productId, sellingPrice, purchasePrice } = parsed.data;
  if (sellingPrice === undefined && purchasePrice === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(sellingPrice === undefined ? {} : { sellingPrice }),
      ...(purchasePrice === undefined ? {} : { purchasePrice }),
    },
  });

  return NextResponse.json({ product: updated });
}

