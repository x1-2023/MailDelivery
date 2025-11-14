import { NextResponse } from 'next/server'

export async function GET() {
  // Get domains from environment variable
  const domainsEnv = process.env.DOMAINS || '0xf5.site'
  const domains = domainsEnv.split(',').map(d => d.trim())
  
  return NextResponse.json({
    domains,
    defaultDomain: domains[0],
    total: domains.length
  })
}
