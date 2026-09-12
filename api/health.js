export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ status: 'error', error: 'Method Not Allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    releaseSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    region: process.env.VERCEL_REGION || null,
    timestamp: new Date().toISOString(),
  })
}
