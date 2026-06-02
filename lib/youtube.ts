import { google } from 'googleapis'
import fs from 'fs'

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN })
  return oauth2Client
}

export async function uploadToYouTube(videoPath: string, titulo: string, descricao: string) {
  const auth = getOAuthClient()
  const youtube = google.youtube({ version: 'v3', auth })

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: titulo, description: descricao, categoryId: '29' },
      status: { privacyStatus: 'public' },
    },
    media: { body: fs.createReadStream(videoPath) },
  })

  return response.data.id
}
