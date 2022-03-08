import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import localizeObject from '../localizeObject';

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const locale = context.switchToHttp().getRequest().headers[
          'accept-language'
        ];
        return localizeObject(data, locale);
      }),
    );
  }
}
