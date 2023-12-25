import { RefeshToken } from '@/types';
import { ObjectId } from 'mongodb';

export class TokenSchema {
  _id: ObjectId;
  tokens: string;
  user_id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  constructor({ _id, tokens, user_id, createdAt, updatedAt }: RefeshToken) {
    const date = new Date();
    this._id = _id || new ObjectId();
    this.tokens = tokens;
    this.user_id = user_id;
    this.createdAt = createdAt || date;
    this.updatedAt = updatedAt || date;
  }
}
