# Bokadirekt API - Research Findings

## API Documentation
- Portal: https://external.api.portal.bokadirekt.se/index.html
- API Name: M3 external API (v1)
- Authentication: Header `X-API-KEY: your-api-key`
- Rate Limit: 10 requests per minute per IP address

## Available Endpoints

### Bookings
- **GET** `/api/v1/bookings`
- Query Parameters:
  - `FilterOnStartDate` (boolean) - Filter on scheduled start date instead of creation date
  - `StartDate` (string date-time) - Start date for filtering
  - `EndDate` (string date-time) - End date for filtering
  
- Response fields (camelCase):
  - `salonId`, `salonName`
  - `customerId`, `customerName`
  - `resourceId`, `resourceName`, `resourceNickName`
  - `bookingId`, `bookingGroupId`
  - `serviceId`, `serviceName`
  - `created` (date-time)
  - `startDate` (date-time)
  - `endDate` (date-time)
  - `bookedPrice` (number)
  - `onlineBooking` (boolean)
  - `cancelled` (boolean)
  - `dropIn` (boolean)
  - `rebooked` (boolean)

### Other Endpoints
- Customers
- Products
- Resources (Staff)
- Sales
- Services

## URL Testing Results
Tested multiple URL variations:
- `https://api.bokadirekt.se/api/v1/*` - 404
- `https://external.api.bokadirekt.se/api/v1/*` - SSL certificate error
- `https://m3-api.bokadirekt.se/api/v1/*` - 302 redirect to www.bokadirekt.se

## Current Issues
1. Cannot determine correct base URL from documentation
2. All attempted URLs either return 404 or redirect to main website
3. May need to verify API key is active/correct

## Next Steps
1. Verify API key with user
2. Check if there's a different base URL or additional setup required
3. Consider reaching out to Bokadirekt support for correct endpoint
