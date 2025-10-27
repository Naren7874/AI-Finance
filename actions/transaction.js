"use server";
import aj from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();
    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });
    
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset
          }
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request Blocked");
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await prisma.account.findFirst({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const balanceChanged = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChanged;
    
    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          amount: data.amount,
          date: data.date,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });
      
      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
      
      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    
    return {
      success: true,
      data: serializeTransaction(transaction)
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

function calculateNextRecurringDate(date, interval) {
  const currentDate = new Date(date);
  switch (interval) {
    case "DAILY":
      currentDate.setDate(currentDate.getDate() + 1);
      break;
    case "WEEKLY":
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case "MONTHLY":
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    case "YEARLY":
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      break;
    default:
      throw new Error("Invalid recurring interval");
  }
  return currentDate;
}