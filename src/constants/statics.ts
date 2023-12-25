export const regexUsername = /^(?![0-9]+$)[A-Za-z0-9_]{4,15}$/
export const fieldsCanUpdate = [
  'username',
  'bio',
  'date_birth',
  'avatar',
  'cover_photo',
  'website',
  'location'
]
export const ignoreField = {
  password: 0,
  reset_pass_token: 0,
  email_token: 0,
  verify: 0,
  createdAt: 0,
  updatedAt: 0
}

export const collection = {
  USERS: 'users',
  REFRESHTOKEN: 'refresh_token',
  TWEETS: 'tweets',
  HASHTAGS: 'hashtags',
  BOOKMARKS: 'bookmarks',
  FOLLOWERS: 'followers',
  CONVERSATION: 'conversation'
}
