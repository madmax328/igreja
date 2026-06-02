import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(filePath: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    language: 'pt',
  })
  return transcription.text
}

export async function suggestCuts(transcription: string, duracaoTotal: number): Promise<Array<{titulo: string, descricao: string, timestamp_inicio: number, timestamp_fim: number}>> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: 'És um assistente especializado em edição de vídeo de cultos religiosos. Analisa transcrições e identifica os momentos mais impactantes para clips de redes sociais.',
    }, {
      role: 'user',
      content: `Analisa esta transcrição de um culto com duração de ${duracaoTotal} segundos e identifica 3-5 segmentos mais relevantes (momentos de energia, citações bíblicas, pontos-chave). Responde em JSON com array de objetos: [{titulo, descricao, timestamp_inicio, timestamp_fim}]. Os timestamps devem ser em segundos.\n\nTranscrição:\n${transcription}`,
    }],
    response_format: { type: 'json_object' },
  })
  const result = JSON.parse(completion.choices[0].message.content || '{"cortes":[]}')
  return result.cortes || []
}
