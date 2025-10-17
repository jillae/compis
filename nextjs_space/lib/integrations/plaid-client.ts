
// Plaid Bank Account Data API Client
// Read-only access to bank transactions from Swedish and international banks

import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  TransactionsGetRequest,
  TransactionsSyncRequest,
} from 'plaid'

export interface PlaidConfig {
  clientId: string
  secret: string
  environment: 'sandbox' | 'development' | 'production'
}

export class PlaidClient {
  private client: PlaidApi
  private environment: string

  constructor(config: PlaidConfig) {
    this.environment = config.environment
    
    const configuration = new Configuration({
      basePath: PlaidEnvironments[config.environment],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': config.clientId,
          'PLAID-SECRET': config.secret,
        },
      },
    })

    this.client = new PlaidApi(configuration)
  }

  /**
   * Step 1: Create Link Token for frontend
   * This token is used to initialize Plaid Link UI component
   */
  async createLinkToken(params: {
    userId: string
    clientName: string
    language?: string
    countryCodes?: CountryCode[]
    products?: Products[]
    redirectUri?: string
  }) {
    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: params.userId,
      },
      client_name: params.clientName || 'Flow App',
      products: params.products || [Products.Transactions],
      country_codes: params.countryCodes || [CountryCode.Se], // Sweden
      language: params.language || 'sv',
    }

    if (params.redirectUri) {
      request.redirect_uri = params.redirectUri
    }

    const response = await this.client.linkTokenCreate(request)
    return response.data
  }

  /**
   * Step 2: Exchange Public Token for Access Token
   * Called after user completes Plaid Link flow
   */
  async exchangePublicToken(publicToken: string) {
    const request: ItemPublicTokenExchangeRequest = {
      public_token: publicToken,
    }

    const response = await this.client.itemPublicTokenExchange(request)
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    }
  }

  /**
   * Step 3: Get Account Information
   * Retrieve all accounts linked to this access token
   */
  async getAccounts(accessToken: string) {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    }

    const response = await this.client.accountsGet(request)
    return {
      accounts: response.data.accounts,
      item: response.data.item,
    }
  }

  /**
   * Step 4: Get Transactions (Date Range)
   * Retrieve transactions for a specific date range
   */
  async getTransactions(params: {
    accessToken: string
    startDate: string // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
    count?: number
    offset?: number
  }) {
    const request: TransactionsGetRequest = {
      access_token: params.accessToken,
      start_date: params.startDate,
      end_date: params.endDate,
      options: {
        count: params.count || 500,
        offset: params.offset || 0,
      },
    }

    const response = await this.client.transactionsGet(request)
    return {
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      totalTransactions: response.data.total_transactions,
    }
  }

  /**
   * Step 5: Sync Transactions (Incremental)
   * More efficient way to get new transactions since last sync
   */
  async syncTransactions(params: {
    accessToken: string
    cursor?: string // For pagination/incremental sync
    count?: number
  }) {
    const request: TransactionsSyncRequest = {
      access_token: params.accessToken,
      count: params.count || 500,
    }

    if (params.cursor) {
      request.cursor = params.cursor
    }

    const response = await this.client.transactionsSync(request)
    return {
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    }
  }

  /**
   * Get Item (Bank Connection) Information
   */
  async getItem(accessToken: string) {
    const response = await this.client.itemGet({
      access_token: accessToken,
    })
    return response.data
  }

  /**
   * Get Institution Info (Bank Details)
   */
  async getInstitution(institutionId: string, countryCodes: CountryCode[] = [CountryCode.Se]) {
    const response = await this.client.institutionsGetById({
      institution_id: institutionId,
      country_codes: countryCodes,
    })
    return response.data.institution
  }

  /**
   * Helper: Format date for Plaid API (YYYY-MM-DD)
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Helper: Get date range for last N days
   */
  static getDateRange(days: number = 30): { startDate: string; endDate: string } {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    }
  }
}

// Factory function to create Plaid client from environment variables
export function createPlaidClient(): PlaidClient {
  const clientId = process.env.PLAID_CLIENT_ID
  const secret = process.env.PLAID_SECRET
  const environment = (process.env.PLAID_ENV || 'sandbox') as 'sandbox' | 'development' | 'production'

  if (!clientId || !secret) {
    throw new Error('Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.')
  }

  return new PlaidClient({
    clientId,
    secret,
    environment,
  })
}

export default PlaidClient
