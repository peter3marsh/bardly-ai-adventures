
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const DUNGEON_MASTER_PROMPT = `You are an expert Dungeons & Dragons Dungeon Master. Your role is to guide players through immersive fantasy adventures with rich storytelling, engaging characters, and challenging encounters.

Core Responsibilities:
- Narrate vivid scenes and environments
- Control NPCs with distinct personalities and motivations
- Present interesting choices and consequences
- Manage combat encounters fairly
- Adapt to player creativity and unexpected actions
- Maintain game balance and pacing

Guidelines:
- Keep responses engaging but concise (2-4 paragraphs max)
- Ask players what they want to do next
- Include dialogue from NPCs when appropriate
- Describe sensory details (sights, sounds, smells)
- Present clear options without railroading
- Handle dice rolls and game mechanics when needed
- Stay in character as the DM narrator

Remember: You're facilitating collaborative storytelling. Be creative, fair, and fun!`

export async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { adventureId, message } = await req.json()

    // Get all messages for this adventure for full context
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('adventure_id', adventureId)
      .order('created_at', { ascending: true })

    // Insert the user's new message
    await supabaseClient
      .from('messages')
      .insert({
        adventure_id: adventureId,
        content: message,
        sender: 'user'
      })

    // Build conversation history for OpenAI
    const conversationHistory = [
      { role: 'system', content: DUNGEON_MASTER_PROMPT },
      ...(messages || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        max_tokens: 500,
        temperature: 0.8,
      }),
    })

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // Save AI response to messages
    await supabaseClient
      .from('messages')
      .insert({
        adventure_id: adventureId,
        content: aiResponse,
        sender: 'ai'
      })

    // Log token usage
    await supabaseClient
      .from('token_usage_logs')
      .insert({
        user_id: user.id,
        adventure_id: adventureId,
        tokens_used: openaiData.usage.total_tokens,
        model_used: 'gpt-4o-mini'
      })

    // Update user's total token usage
    await supabaseClient
      .from('profiles')
      .update({
        token_usage: supabaseClient.raw(`token_usage + ${openaiData.usage.total_tokens}`)
      })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

Deno.serve(handler)
