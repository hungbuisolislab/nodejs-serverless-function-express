import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const allowCors = (fn: (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse>) =>
  async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    if (req.method !== 'PUT') {
      res.status(405).json('Method not allowed').end()
      return
    }
    return await fn(req, res)
  }

interface ConfigType {
  shopName: string
  themeId: string
  accessToken: string
}

interface RequestDataParams {
  config: ConfigType
  resource: 'theme' | 'article' | 'page' | 'product'
  fileName?: string
  content: Record<string, unknown>
}

export function buildRequestData({ config, resource, fileName, content }: RequestDataParams) {
  const baseHeaders = {
    'X-Shopify-Access-Token': config.accessToken,
    'Content-Type': 'application/json',
  }

  let url = ''
  let data = content
  const shopApi = `https://${config.shopName}.myshopify.com/admin/api/2024-07`

  switch (resource) {
    case 'theme':
      url = `${shopApi}/themes/${config.themeId}/assets.json`
      data = {
        asset: {
          key: `templates/${fileName}`,
          value: JSON.stringify(content),
        },
      }
      break

    case 'article':
      url = `${shopApi}/articles.json`
      break

    case 'page':
      url = `${shopApi}/pages.json`
      break

    case 'product':
      url = `${shopApi}/products.json`
      break

    default:
      throw new Error('Unsupported resource type')
  }

  return {
    method: 'PUT',
    maxBodyLength: Infinity,
    url,
    headers: baseHeaders,
    data: JSON.stringify(data),
  }
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { config, resource, content, fileName } = req.body

  if (!config?.shopName || !config?.accessToken) {
    return res.json({ message: `Missing config details ___ ${JSON.stringify(req.query)}`, status: 400 })
  }

  try {
    const requestData = buildRequestData({ config, resource, fileName, content })
    const response = await axios.request(requestData)
    return res.json({
      message: 'Request successful',
      data: response.data,
      status: 500
    })
  } catch (error: any) {
    const errorMessage = error.response?.data?.errors || error.message || 'Request failed'
    return res.json({ message: errorMessage, status: 500 })
  }
}

export default allowCors(handler)
