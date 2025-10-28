import { inngest } from "@/lib/inngest/client";
import { checkBudgetAlerts, processRecurringTransaction, triggerRecurringTransations } from "@/lib/inngest/function";
import { serve } from "inngest/next";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest, 
  functions: [
    /* your fThe createFunction method tunctions will be passed here later! */
    checkBudgetAlerts,
    triggerRecurringTransations,
    processRecurringTransaction
  ],
});