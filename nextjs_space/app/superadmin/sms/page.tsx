'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SMSOverview } from '@/components/superadmin/sms/sms-overview'
import { ManualSMSForm } from '@/components/superadmin/sms/manual-sms-form'
import { CampaignManager } from '@/components/superadmin/sms/campaign-manager'
import { SMSSettings } from '@/components/superadmin/sms/sms-settings'
import { MessageSquare } from 'lucide-react'

export default function SuperAdminSMSPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            💬 SMS & Kampanjer
          </h1>
          <p className="text-muted-foreground mt-1">
            SuperAdmin kontroll: 46elks integration, kampanjhantering & analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Översikt</TabsTrigger>
          <TabsTrigger value="send">🚀 Skicka SMS</TabsTrigger>
          <TabsTrigger value="campaigns">📅 Kampanjer</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Inställningar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SMSOverview />
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <ManualSMSForm />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SMSSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
