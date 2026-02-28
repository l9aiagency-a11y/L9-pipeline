const GRAPH = 'https://graph.facebook.com/v19.0'

function accessToken(): string {
  const t = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!t) throw new Error('INSTAGRAM_ACCESS_TOKEN not set')
  return t
}

function accountId(): string {
  const id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (!id) throw new Error('INSTAGRAM_BUSINESS_ACCOUNT_ID not set')
  return id
}

export async function getReelStatus(containerId: string): Promise<string> {
  const res = await fetch(
    `${GRAPH}/${containerId}?fields=status_code&access_token=${accessToken()}`
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instagram container status failed ${res.status}: ${err}`)
  }
  const data = await res.json() as { status_code: string }
  return data.status_code
}

export async function publishReel(params: {
  videoUrl: string
  coverUrl: string
  caption: string
  postId: string
}): Promise<{ instagramPostId: string }> {
  const { videoUrl, coverUrl, caption } = params

  // 1. Create media container
  const createRes = await fetch(`${GRAPH}/${accountId()}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      cover_url: coverUrl,
      access_token: accessToken(),
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Instagram create container failed ${createRes.status}: ${err}`)
  }

  const { id: containerId } = await createRes.json() as { id: string }

  // 2. Poll until FINISHED (up to 60s, every 5s)
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5_000))
    const statusCode = await getReelStatus(containerId)
    if (statusCode === 'FINISHED') break
    if (statusCode === 'ERROR') {
      throw new Error(`Instagram container processing failed (status=ERROR) for containerId=${containerId}`)
    }
    // IN_PROGRESS or other — keep waiting
  }

  // 3. Publish the container
  const publishRes = await fetch(`${GRAPH}/${accountId()}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken(),
    }),
  })

  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`Instagram publish failed ${publishRes.status}: ${err}`)
  }

  const { id: instagramPostId } = await publishRes.json() as { id: string }
  return { instagramPostId }
}
