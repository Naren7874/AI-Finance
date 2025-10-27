import { getUserAccounts } from '@/actions/dashboard'
import React from 'react'
import AddTransactionForm from '../_components/transaction-form'
import { defaultCategories } from '@/data/category'

const Page = async () => {
    const accounts = await getUserAccounts()

  return (
    <div className='max-w-3xl mx-auto px-5'>
        <h1 className='text-3xl gradient-title mb-8'>
            Add Transaction
        </h1>
        <AddTransactionForm accounts={accounts} categories={defaultCategories} />
    </div>
  )
}

export default Page