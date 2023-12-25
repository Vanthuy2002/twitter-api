import { httpStatus } from '@/constants/httpStatus';
import { messageValidator } from '@/constants/message';

type ErrorType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithStatus {
  message: string;
  status: number;
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message;
    this.status = status;
  }
}

export class ErrorsEntity extends ErrorWithStatus {
  declare error: ErrorType;
  constructor({ error }: { message?: string; error: ErrorType }) {
    super({
      message: messageValidator.default,
      status: httpStatus.UNPROCESSABLE_ENTITY,
    });

    this.error = error;
  }
}
