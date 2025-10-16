
// GoCardless Bank Account Data API Client (formerly Nordigen)
// Read-only access to bank transactions from Nordea and other banks

interface GoCardlessConfig {
  baseUrl: string
  accessToken: string
}

interface Institution {
  id: string
  name: string
  bic: string
  transaction_total_days: string
  countries: string[]
  logo: string
}

interface RequisitionResponse {
  id: string
  created: string
  redirect: string
  status: string
  institution_id: string
  agreement: string
  reference: string
  accounts: string[]
  user_language: string
  link: string
  ssn: string | null
  account_selection: boolean
  redirect_immediate: boolean
}

interface AccountDetails {
  id: string
  created: string
  last_accessed: string
  iban: string
  institution_id: string
  status: string
  owner_name: string
}

interface Transaction {
  transactionId: string
  bookingDate: string
  valueDate: string
  transactionAmount: {
    amount: string
    currency: string
  }
  debtorName?: string
  creditorName?: string
  remittanceInformationUnstructured?: string
  proprietaryBankTransactionCode?: string
  internalTransactionId?: string
}

interface Balance {
  balanceAmount: {
    amount: string
    currency: string
  }
  balanceType: string
  referenceDate: string
}

export class GoCardlessClient {
  private config: GoCardlessConfig

  constructor(accessToken: string, useSandbox = false) {
    this.config = {
      baseUrl: 'https://bankaccountdata.gocardless.com/api/v2',
      accessToken,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `GoCardless API error: ${response.status} ${response.statusText} - ${error}`
      )
    }

    return response.json()
  }

  // 1. List available banks (institutions) for a country
  async getInstitutions(country = 'se'): Promise<Institution[]> {
    return this.request<Institution[]>(`/institutions/?country=${country}`)
  }

  // 2. Create a requisition (bank connection)
  async createRequisition(params: {
    institutionId: string
    redirectUrl: string
    reference: string
  }): Promise<RequisitionResponse> {
    return this.request<RequisitionResponse>('/requisitions/', {
      method: 'POST',
      body: JSON.stringify({
        redirect: params.redirectUrl,
        institution_id: params.institutionId,
        reference: params.reference,
        user_language: 'sv',
      }),
    })
  }

  // 3. Get requisition by ID (includes account IDs after user authorization)
  async getRequisition(requisitionId: string): Promise<RequisitionResponse> {
    return this.request<RequisitionResponse>(`/requisitions/${requisitionId}/`)
  }

  // 4. Delete requisition
  async deleteRequisition(requisitionId: string): Promise<void> {
    return this.request<void>(`/requisitions/${requisitionId}/`, {
      method: 'DELETE',
    })
  }

  // 5. Get account details
  async getAccountDetails(accountId: string): Promise<AccountDetails> {
    return this.request<AccountDetails>(`/accounts/${accountId}/details/`)
  }

  // 6. Get account balances
  async getAccountBalances(accountId: string): Promise<{ balances: Balance[] }> {
    return this.request<{ balances: Balance[] }>(`/accounts/${accountId}/balances/`)
  }

  // 7. Get account transactions
  async getAccountTransactions(
    accountId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ transactions: { booked: Transaction[]; pending: Transaction[] } }> {
    let endpoint = `/accounts/${accountId}/transactions/`
    const params = new URLSearchParams()
    
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    return this.request<{ transactions: { booked: Transaction[]; pending: Transaction[] } }>(
      endpoint
    )
  }

  // Helper: Get Nordea institution ID for Sweden
  static getNordeaInstitutionId(sandbox = false): string {
    return sandbox ? 'NDEASES1_SANDBOX' : 'NORDEA_NDEASES1'
  }

  // Helper: Get Nordea Sandbox institution ID
  static getNordeaSandboxInstitutionId(): string {
    return 'NDEASES1_SANDBOX'
  }

  // Helper: Format date for API (YYYY-MM-DD)
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Helper: Check if requisition is complete
  static isRequisitionComplete(requisition: RequisitionResponse): boolean {
    return requisition.status === 'LN' && requisition.accounts.length > 0
  }
}

export default GoCardlessClient
