import { getUserAccounts } from "@/actions/dashboard";
import React from "react";
import AddTransactionForm from "../_components/transaction-form";
import { defaultCategories } from "@/data/category";
import { getTransaction } from "@/actions/transaction";

const Page = async ({ searchParams }) => {
  const accounts = await getUserAccounts();
  const editId = searchParams?.edit;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction.data;
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <h1 className="text-3xl gradient-title mb-8">{editId?"Edit":"Add"} Transaction</h1>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
};

export default Page;
