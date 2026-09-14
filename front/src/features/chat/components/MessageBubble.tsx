import type { Message } from '../types'

export default function MessageBubble({ message }: { message: Message }) {
  const isMe = message.sender === 'me'
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isMe
            ? 'bg-[#aa3bff] text-white rounded-br-none dark:bg-violet-600'
            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none dark:bg-zinc-800 dark:text-white dark:border-zinc-700'
        }`}
      >
        <p>{message.text}</p>
        <p className={`mt-1 text-[11px] ${isMe ? 'text-white/70' : 'text-gray-400 dark:text-zinc-500'}`}>{message.at}</p>
      </div>
    </div>
  )
}
