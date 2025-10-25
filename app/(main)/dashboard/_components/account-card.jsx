"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { updateDefaultAccount } from "@/actions/account";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;
  const {
    loading: updateDefaultLoading,
    fn: updateDefaultAccountFn,
    error,
    data: updatedAccount
  } = useFetch(updateDefaultAccount);
  
  const handleDefaultChange = async (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (isDefault) {
      toast.warning("This account is already the default account.");
      return;
    }
    await updateDefaultAccountFn(id);
  }

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully.");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message || "Something went wrong."}`);
    }
  }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${id}`} className="block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading || isDefault}
            aria-label="Set as default account"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${parseFloat(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}