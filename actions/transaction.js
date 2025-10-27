"use server";
import aj from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

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
            resetInSeconds: reset,
          },
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
      data: serializeTransaction(transaction),
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      error: error.message,
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

export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const arrayBuffer = await file.arrayBuffer();
    const base64String = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type,
          data: base64String,
        },
      },
      {
        text: prompt,
      },
    ]);

    const text = result.response.text();

    const cleanedText = text.replace(/```(?:json)?\n?|```/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    if (
      error.message.includes("API key") ||
      error.message.includes("API_KEY")
    ) {
      throw new Error(
        "Google AI API key is missing or invalid. Please check your environment variables."
      );
    } else if (
      error.message.includes("quota") ||
      error.message.includes("rate limit")
    ) {
      throw new Error("AI service limit reached. Please try again later.");
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      throw new Error(
        "Network error. Please check your internet connection and try again."
      );
    } else {
      throw new Error(
        "Failed to scan receipt. Please try again with a clearer image."
      );
    }
  }
}
