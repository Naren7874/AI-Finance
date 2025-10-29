import { sendEmail } from "@/actions/send-email";
import { prisma } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/templet";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await prisma.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await prisma.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;
        // Check if we should send an alert
        if (
          percentageUsed >= 80 && // Default threshold of 80%
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // console.log("Your budget data\n", budget);
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                remaining: parseInt(budgetAmount - totalExpenses).toFixed(1),
                category: "Overall Budget",
                accountName: defaultAccount.name,
                // Add days left in month
                daysLeft: getDaysLeftInMonth(),
              },
            }),
          });
          // Update last alert sent
          await prisma.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

function getDaysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

export const triggerRecurringTransations = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Triggr Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    //1. Fetch all due recurring transations
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await prisma.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await prisma.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await prisma.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await prisma.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1); // Start from first day of previous month

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });
        const year = lastMonth.getFullYear();

        // Calculate savings data for the email template
        const savings = stats.totalIncome - stats.totalExpenses;
        const savingsRate = stats.totalIncome > 0 ? (savings / stats.totalIncome) * 100 : 0;

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName} ${year}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              month: monthName,
              year: year.toString(),
              stats: {
                totalIncome: stats.totalIncome,
                totalExpenses: stats.totalExpenses,
                savings: savings,
                savingsRate: savingsRate,
                byCategory: stats.byCategory,
                transactionCount: stats.transactionCount,
              },
              insights: insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// Update the getMonthlyStats function to ensure proper date range
const getMonthlyStats = async (userId, month) => {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999); // End of the last day

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
};

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const savings = stats.totalIncome - stats.totalExpenses;
  const savingsRate = stats.totalIncome > 0 ? (savings / stats.totalIncome) * 100 : 0;

  const prompt = `
    Analyze this financial data for ${month} and provide 3 concise, actionable insights.
    Focus on spending patterns, savings rate, and practical advice.
    Keep it friendly and conversational.

    Financial Data:
    - Total Income: ₹${stats.totalIncome.toFixed(2)}
    - Total Expenses: ₹${stats.totalExpenses.toFixed(2)}
    - Net Savings: ₹${savings.toFixed(2)}
    - Savings Rate:₹${savingsRate.toFixed(1)}%
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount.toFixed(2)}`)
      .join(", ")}

    Provide insights that would help someone understand their financial health better.
    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    // Return more relevant fallback insights based on actual data
    const fallbackInsights = [];
    
    if (savingsRate > 20) {
      fallbackInsights.push("Great job! You're saving more than 20% of your income this month.");
    } else if (savingsRate < 0) {
      fallbackInsights.push("You spent more than you earned this month. Consider reviewing your expenses.");
    } else {
      fallbackInsights.push("Your savings rate is positive. Look for opportunities to increase it further.");
    }

    if (Object.keys(stats.byCategory).length > 0) {
      const topCategory = Object.entries(stats.byCategory).reduce((a, b) => a[1] > b[1] ? a : b);
      fallbackInsights.push(`Your highest spending category was ${topCategory[0]} at ₹${topCategory[1].toFixed(2)}.`);
    }

    fallbackInsights.push("Tracking your expenses regularly helps identify spending patterns and savings opportunities.");

    return fallbackInsights.slice(0, 3);
  }
}

// async function generateFinancialInsights(stats, month) {
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   const prompt = `
//     Analyze this financial data and provide 3 concise, actionable insights.
//     Focus on spending patterns and practical advice.
//     Keep it friendly and conversational.

//     Financial Data for ${month}:
//     - Total Income: $${stats.totalIncome}
//     - Total Expenses: $${stats.totalExpenses}
//     - Net Income: $${stats.totalIncome - stats.totalExpenses}
//     - Expense Categories: ${Object.entries(stats.byCategory)
//       .map(([category, amount]) => `${category}: $${amount}`)
//       .join(", ")}

//     Format the response as a JSON array of strings, like this:
//     ["insight 1", "insight 2", "insight 3"]
//   `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response;
//     const text = response.text();
//     const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

//     return JSON.parse(cleanedText);
//   } catch (error) {
//     console.error("Error generating insights:", error);
//     return [
//       "Your highest expense category this month might need attention.",
//       "Consider setting up a budget for better financial management.",
//       "Track your recurring expenses to identify potential savings.",
//     ];
//   }
// }


