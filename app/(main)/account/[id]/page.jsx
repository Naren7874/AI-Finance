import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccountPage({ params }) {
  const { id } = params;
  
  return (
    <div className="px-5">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Account Details</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Account ID: {id}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This page will show detailed account information and transactions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
