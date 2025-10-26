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

export async function bulkDeleteTransactions(transactionIds) {
  try {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return { success: false, error: "No transaction IDs provided" };
    }

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Fetch transactions to determine how to adjust balances
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
      // include accountId and amount and type
      select: {
        id: true,
        accountId: true,
        amount: true,
        type: true,
      },
    });

    if (transactions.length === 0) {
      return { success: false, error: "No transactions found for given IDs" };
    }

    // Group balance changes per account (as numbers)
    const accountBalanceChanges = transactions.reduce((acc, tx) => {
      const amt =
        typeof tx.amount?.toNumber === "function"
          ? tx.amount.toNumber()
          : Number(tx.amount || 0);

      // deleting an EXPENSE should INCREASE the account balance by amt
      // deleting an INCOME should DECREASE the account balance by amt
      const change = tx.type === "EXPENSE" ? amt : -amt;

      acc[tx.accountId] = (acc[tx.accountId] || 0) + change;
      return acc;
    }, {});

    // Do the delete + balance updates in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      // Update balances for affected accounts
      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        // convert balanceChange to number to be safe
        const changeNum = Number(balanceChange);

        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              // increment by changeNum (positive or negative)
              increment: changeNum,
            },
          },
        });
      }
    });

    // Revalidate the dashboard and each affected account page
    revalidatePath("/dashboard");
    const affectedAccountIds = Object.keys(accountBalanceChanges);
    for (const accId of affectedAccountIds) {
      try {
        revalidatePath(`/account/${accId}`);
      } catch (err) {
        console.error(`Failed to revalidate path for account ${accId}:`, err);
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || String(error) };
  }
}