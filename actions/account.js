"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { date } from "zod";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const updatedAccount = await prisma.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: serializeTransaction(updatedAccount),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAccAndTransations(accountId) {
  try {
    const { userId } = await auth();
     if (!userId) throw new Error("Unauthorized");
 
     const user = await prisma.user.findUnique({
       where: { clerkUserId: userId },
     });
 
     if (!user) {
       throw new Error("User not found");
     }
     const account = await prisma.account.findUnique({
       where: { id: accountId, userId: user.id },
       include: {
         transactions: {
           orderBy: { date: "desc" },
         },
         _count: {
          select: { transactions: true},
         }
       },
     });
      
    if (!account) {
      throw new Error("Account not found");
    }
    
    const serializedAccount = {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
    return {
      success: true,
      data: serializedAccount,
    };

  } catch (error) {
    return{
      success: false,
      error: error.message,
    }
  }
}