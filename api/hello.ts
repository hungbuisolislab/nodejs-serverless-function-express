import type { VercelRequest, VercelResponse } from '@vercel/node'

const allowCors = (fn: (req: VercelRequest, res: VercelResponse) => Promise<void> | void) =>
  async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    return await fn(req, res)
  }

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { name = 'World' } = req.query
  return res.json({
    message: `Hello ${name}!`,
  })
}

export default allowCors(handler)
