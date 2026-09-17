export type Message = {
  id: string
  text: string
  sender: 'me' | 'other'
  at: string
}

export type Conversation = {
  id: string
  username: string
  avatarUrl: string | null
  lastMessage: string
}
