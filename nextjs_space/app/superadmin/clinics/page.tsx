
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Search, Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Clinic {
  id: string
  name: string
  tier: string
  subscriptionStatus: string
  isActive: boolean
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClinics()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = clinics.filter(clinic => 
        clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredClinics(filtered)
    } else {
      setFilteredClinics(clinics)
    }
  }, [searchTerm, clinics])

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/superadmin/clinics')
      if (res.ok) {
        const data = await res.json()
        setClinics(data.clinics)
        setFilteredClinics(data.clinics)
      }
    } catch (error) {
      console.error('Error fetching clinics:', error)
      toast.error('Kunde inte hämta kliniker')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alla Kliniker</h1>
          <p className="text-muted-foreground">Hantera alla registrerade kliniker</p>
        </div>
        <Link href="/superadmin/clinics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Lägg till Klinik
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök kliniker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredClinics.length} av {clinics.length} kliniker
        </div>
      </div>

      {/* Clinics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge 
                      variant={
                        clinic.tier === 'BASIC' ? 'secondary' : 
                        clinic.tier === 'PROFESSIONAL' ? 'default' : 
                        'destructive'
                      }
                    >
                      {clinic.tier}
                    </Badge>
                    <Badge 
                      variant={
                        clinic.subscriptionStatus === 'ACTIVE' ? 'default' : 
                        clinic.subscriptionStatus === 'TRIAL' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {clinic.subscriptionStatus}
                    </Badge>
                    {!clinic.isActive && (
                      <Badge variant="destructive">INACTIVE</Badge>
                    )}
                  </div>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link href={`/superadmin/clinics/${clinic.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Hantera
                  </Button>
                </Link>
                <Link href={`/dashboard?clinicId=${clinic.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClinics.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Inga kliniker matchar din sökning' : 'Inga kliniker hittades'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
