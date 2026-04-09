import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const isAdmin = user.role === "ADMIN";

  const products = await prisma.product.findMany({
    orderBy: [{ name: "asc" }, { size: "asc" }],
    select: isAdmin
      ? {
          id: true,
          name: true,
          size: true,
          sellingPrice: true,
          purchasePrice: true,
          quantity: true,
        }
      : {
          id: true,
          name: true,
          size: true,
          sellingPrice: true,
        },
  });

  return NextResponse.json({ products });
}
