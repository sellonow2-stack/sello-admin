import { HeartHandshake } from 'lucide-react'
import { useSupport } from '@/hooks/useSupport'
import { useBugReports } from '@/hooks/useBugReports'
import { ChurnAlerts } from '@/components/features/ChurnAlerts'
import { CohortTable } from '@/components/features/CohortTable'
import { BugReportsTable } from '@/components/features/BugReportsTable'

export default function SupportPage() {
  const { churnAlerts, cohortRows, isLoading, error } = useSupport()
  const { reports, isLoading: bugReportsLoading, error: bugReportsError, refresh, updateStatus } = useBugReports()

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <HeartHandshake size={18} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Support & Rétention</h1>
          <p className="text-sm text-gray-500">Churn, cohortes et feedback utilisateurs</p>
        </div>
      </div>

      {/* Erreur globale */}
      {(error || bugReportsError) && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          Erreur de chargement : {error ?? bugReportsError}
        </div>
      )}

      <div className="space-y-6">
        {/* Section 0 — Signalements de bugs */}
        <BugReportsTable
          reports={reports}
          isLoading={bugReportsLoading}
          onRefresh={refresh}
          onUpdateStatus={updateStatus}
        />

        {/* Section 1 — Alertes Churn */}
        <ChurnAlerts alerts={churnAlerts} isLoading={isLoading} />

        {/* Section 2 — Analyse de Cohorte */}
        <CohortTable rows={cohortRows} isLoading={isLoading} />
      </div>
    </div>
  )
}
