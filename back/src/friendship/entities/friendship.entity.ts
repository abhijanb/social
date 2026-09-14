export class Friendship {
  id!: string
  requesterId!: string
  addresseeId!: string
  status!: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  createdAt!: Date
  updatedAt!: Date
}
