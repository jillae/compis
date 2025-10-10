
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Download,
  Eye
} from "lucide-react"
import { CSVMapping, ImportResult } from "@/lib/types"

interface CSVPreview {
  headers: string[]
  rows: string[][]
}

export default function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVPreview | null>(null)
  const [mappings, setMappings] = useState<Partial<CSVMapping>>({})
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload')
  const router = useRouter()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    
    // Parse CSV for preview
    const text = await selectedFile.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
    const rows = lines.slice(1, 6).map(line => 
      line.split(',').map(cell => cell.trim().replace(/['"]/g, ''))
    )
    
    setPreview({ headers, rows })
    setStep('map')
  }

  const handleMappingChange = (field: keyof CSVMapping, value: string) => {
    setMappings(prev => ({ ...prev, [field]: value }))
  }

  const handlePreview = () => {
    const requiredFields = ['customerEmail', 'treatmentType', 'scheduledTime']
    const missingFields = requiredFields.filter(field => !mappings[field as keyof CSVMapping])
    
    if (missingFields.length > 0) {
      alert(`Please map required fields: ${missingFields.join(', ')}`)
      return
    }
    
    setStep('preview')
  }

  const handleImport = async () => {
    if (!file || !mappings) return

    setImporting(true)
    setStep('result')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mappings', JSON.stringify(mappings))

    try {
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setImportResult(result)
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        importId: '',
        successCount: 0,
        errorCount: 0,
        errors: ['Failed to import data. Please try again.']
      })
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setFile(null)
    setPreview(null)
    setMappings({})
    setImportResult(null)
    setStep('upload')
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" onClick={goToDashboard} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <h1 className="text-xl font-semibold">Import Data</h1>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Step */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload CSV File</span>
              </CardTitle>
              <CardDescription>
                Upload your booking data in CSV format. We support Bokadirekt exports and other standard formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="csv-file" className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Choose CSV file or drag and drop
                    </span>
                  </Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {file && (
                  <div className="mt-4">
                    <Badge variant="secondary">{file.name}</Badge>
                  </div>
                )}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ensure your CSV contains customer email, treatment type, and scheduled time columns.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Mapping Step */}
        {step === 'map' && preview && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Map CSV Columns</CardTitle>
                <CardDescription>
                  Match your CSV columns to our data fields. Required fields are marked with *.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Email *</Label>
                    <Select onValueChange={(value) => handleMappingChange('customerEmail', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Treatment Type *</Label>
                    <Select onValueChange={(value) => handleMappingChange('treatmentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Scheduled Time *</Label>
                    <Select onValueChange={(value) => handleMappingChange('scheduledTime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Phone</Label>
                    <Select onValueChange={(value) => handleMappingChange('customerPhone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Select onValueChange={(value) => handleMappingChange('customerName', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Select onValueChange={(value) => handleMappingChange('price', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                  </Button>
                  <Button onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Import
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Data */}
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  First 5 rows of your CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {preview.headers.map((header, index) => (
                          <th key={index} className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-sm">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Import</CardTitle>
              <CardDescription>
                Review your mapping and click Import to proceed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">File</h4>
                  <p className="text-sm text-gray-600">{file?.name}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estimated Records</h4>
                  <p className="text-sm text-gray-600">{preview?.rows?.length || 0} rows</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Column Mapping</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(mappings).map(([field, columnIndex]) => (
                    columnIndex !== '' && (
                      <div key={field} className="flex justify-between">
                        <span className="text-gray-600">{field}:</span>
                        <span>{preview?.headers?.[parseInt(columnIndex)]}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep('map')}>
                  Back to Mapping
                </Button>
                <Button onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result Step */}
        {step === 'result' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {importing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : importResult?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span>
                  {importing ? 'Importing Data...' : 
                   importResult?.success ? 'Import Completed' : 'Import Failed'}
                </span>
              </CardTitle>
              {!importing && importResult && (
                <CardDescription>
                  {importResult.success ? 
                    `Successfully imported ${importResult.successCount} records` :
                    'There were errors during import'
                  }
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {importing && (
                <Progress value={50} className="w-full" />
              )}

              {importResult && !importing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.successCount}
                      </div>
                      <div className="text-sm text-green-700">Lyckade</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.errorCount}
                      </div>
                      <div className="text-sm text-red-700">Fel</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Feldetaljer</h4>
                      <div className="bg-red-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={resetImport}>
                      Import Another File
                    </Button>
                    <Button onClick={goToDashboard}>
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
