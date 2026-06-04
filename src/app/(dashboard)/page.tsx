import { caller } from '@/trpc/server'
import React from 'react'

const Page = async () => {
  const users = await caller.getUsers()

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{users?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Active Sessions</p>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Reports</p>
          </div>
        </div>
      </div>
      <div className="min-h-[60vh] flex-1 rounded-xl bg-muted/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">No recent activity to display.</p>
      </div>
    </div>
  )
}

export default Page
