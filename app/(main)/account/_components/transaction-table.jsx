// app/account/[id]/_components/transaction-table.jsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TransactionTable({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No transactions found for this account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">{transaction.description || 'No description'}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
              <div className={`font-bold ${transaction.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                {transaction.type === 'INCOME' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}