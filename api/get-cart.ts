import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createStorefrontApiClient,
  CustomFetchApi,
} from '@shopify/storefront-api-client';
import {fetch as nodeFetch} from 'node-fetch';

const client = createStorefrontApiClient({
  storeDomain: 'http://tranhanh.myshopify.com',
  apiVersion: '2024-07',
  publicAccessToken: '7721f0a170e5f13ff30ec1794d794191',
  customFetchApi: nodeFetch,
});

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
    return await fn(req, res)
  }

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { cartId } = JSON.parse(req.body)
  const cartQuery = `
    query CartQuery {
      cart(id: "gid://shopify/Cart/${cartId}") {
        id
        buyerIdentity {
          countryCode
          email
        }
        lines(first: 50) {
          nodes {
            quantity
            merchandise {
              __typename
              ... on ProductVariant {
                id
                price {
                  amount
                }
                title
                image {
                  altText
                  id
                  height
                  url
                  width
                }
                product {
                  title
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const response = await client.request(cartQuery);
    return res.json({
      body: JSON.parse(req.body),
      cartQuery,
      cartId: cartId,
      message: 'Request successful',
      data: response.data,
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.response?.data?.errors || error.message || 'Request failed'
    return res.json({ message: errorMessage, status: 500 })
  }
}

export default allowCors(handler)
