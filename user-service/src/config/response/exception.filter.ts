import { ArgumentsHost, Catch, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class CustomRpcExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost) {
    {
      const error = exception.getError();
      const errorResponse =
        typeof error === 'object' && error !== null
          ? {
              message: error['message'],
              statusCode: error['statusCode'] || 500,
            }
          : { message: error, statusCode: 500 };

      console.log('[CUSTOM RPC EXCEPTION]:', errorResponse);

      return throwError(() => errorResponse);
    }
  }
}
