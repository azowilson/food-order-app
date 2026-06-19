import type { ChatMessage, ChatSession, User } from '../types'
import { getUserDisplayName, getUserInitials } from './users'

export const initialGroupMessages: ChatMessage[] = [
  {
    id: 'm1',
    author: 'Maya',
    authorInitials: 'MY',
    isSelf: false,
    time: '11:42',
    text: 'Anyone up for Thai? I could go for pad thai and maybe spring rolls to share.',
    foodItems: ['pad thai', 'spring rolls'],
  },
  {
    id: 'm2',
    author: 'Jordan',
    authorInitials: 'JO',
    isSelf: false,
    time: '11:44',
    text: 'Yes! I want green curry — medium spice. Also mango sticky rice if they have it.',
    foodItems: ['green curry', 'mango sticky rice'],
  },
  {
    id: 'm3',
    author: 'You',
    authorInitials: 'YO',
    isSelf: true,
    time: '11:46',
    text: 'Pad thai for me too. Sam, are you in?',
    foodItems: ['pad thai'],
  },
  {
    id: 'm4',
    author: 'Sam',
    authorInitials: 'SA',
    isSelf: false,
    time: '11:48',
    text: 'In. Tom yum soup and papaya salad. Can someone grab extra spring rolls?',
    foodItems: ['tom yum soup', 'papaya salad', 'spring rolls'],
  },
  {
    id: 'm5',
    author: 'Priya',
    authorInitials: 'PR',
    isSelf: false,
    time: '11:52',
    text: 'Vegetarian pad thai please — no egg. I will skip dessert.',
    foodItems: ['vegetarian pad thai'],
  },
  {
    id: 'm6',
    author: 'Maya',
    authorInitials: 'MY',
    isSelf: false,
    time: '12:04',
    text: 'Drag food from messages to the order board when you are ready.',
    foodItems: [],
  },
]

function directMessages(friendName: string): ChatMessage[] {
  return [
    {
      id: 'd1',
      author: friendName,
      authorInitials: friendName.slice(0, 2).toUpperCase(),
      isSelf: false,
      time: '10:15',
      text: `Hey! Want to split lunch? I am thinking fried rice or satay.`,
      foodItems: ['fried rice', 'satay'],
    },
    {
      id: 'd2',
      author: 'You',
      authorInitials: 'YO',
      isSelf: true,
      time: '10:18',
      text: 'Satay sounds good to me. Bubble tea too?',
      foodItems: ['satay', 'bubble tea'],
    },
  ]
}

function emptySession(messages: ChatMessage[] = []): ChatSession {
  return {
    messages,
    orderItems: [],
    activeOrder: null,
    completedOrders: [],
    viewingHistoryOrderId: null,
  }
}

export function createSeedData(currentUser: User) {
  const me = currentUser.username

  const friends =
    me === 'maya'
      ? ['jordan', 'sam', 'priya']
      : me === 'jordan'
        ? ['maya', 'sam']
        : me === 'sam'
          ? ['maya', 'jordan']
          : ['maya']

  const groupChatId = `group-${me}-office-lunch`
  const directChatId = (friend: string) => `direct-${[me, friend].sort().join('-')}`

  const groupMembers = ['maya', 'jordan', 'sam', 'priya'].filter(
    (u) => u === me || friends.includes(u),
  )

  const chats = [
    {
      id: groupChatId,
      type: 'group' as const,
      name: 'Office Lunch — Thai Friday',
      memberUsernames: groupMembers.length >= 3 ? groupMembers : [me, ...friends.slice(0, 3)],
      archived: false,
      lastMessage: 'Maya: green curry sounds good',
      time: '12:04',
      unread: me === 'maya' ? 3 : 0,
    },
    ...(friends[0]
      ? [
          {
            id: directChatId(friends[0]),
            type: 'direct' as const,
            name: getUserDisplayName(friends[0]),
            memberUsernames: [me, friends[0]],
            archived: false,
            lastMessage: `${getUserDisplayName(friends[0])}: satay sounds good`,
            time: '10:18',
            unread: 0,
          },
        ]
      : []),
  ]

  const groupMessages = initialGroupMessages.map((message) => ({
    ...message,
    author: message.author === 'You' ? currentUser.displayName : message.author,
    isSelf: message.author === 'You',
    authorInitials:
      message.author === 'You' ? currentUser.initials : message.authorInitials,
  }))

  const chatSessions: Record<string, ChatSession> = {
    [groupChatId]: emptySession(groupMessages),
  }

  if (friends[0]) {
    const friendName = getUserDisplayName(friends[0])
    chatSessions[directChatId(friends[0])] = emptySession(
      directMessages(friendName).map((message) => ({
        ...message,
        isSelf: message.author === 'You',
        authorInitials: message.isSelf ? currentUser.initials : getUserInitials(friends[0]),
        author: message.isSelf ? currentUser.displayName : friendName,
      })),
    )
  }

  return { friends, chats, chatSessions }
}

export const FOOD_MENU = [
  'pad thai',
  'vegetarian pad thai',
  'green curry',
  'spring rolls',
  'mango sticky rice',
  'tom yum soup',
  'papaya salad',
  'fried rice',
  'satay',
  'massaman curry',
  'bubble tea',
]

export const zoneLabels: Record<string, { title: string; hint: string }> = {
  'my-plate': {
    title: 'My plate',
    hint: 'Items you are ordering for yourself',
  },
  'shared-pool': {
    title: 'Shared pool',
    hint: 'Split with the group — appetizers, sides',
  },
  extras: {
    title: 'Extras & notes',
    hint: 'Add-ons, drinks, or maybe items',
  },
}
