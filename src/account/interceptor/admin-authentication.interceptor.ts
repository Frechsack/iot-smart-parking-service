import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { JwtService } from "../service/jwt.service";
import { AUTHENTICATION_HEADER_TOKEN } from "./authentication.interceptor";


@Injectable()
export class AdminAuthenticationInterceptor implements NestInterceptor {

  constructor(
    private readonly jwtService: JwtService
  ) { }

  /**
  * Erstellt ein neues Observable mit dem Fehlercode 401.
  * @returns Gibt ein Observable mit dem Fehlercode 401 zurück.
  */
  private unauthorizedError(message: string): Observable<any> {
    return throwError(() => new HttpException(message, HttpStatus.UNAUTHORIZED));
  }

  /**
  * Prüft eine Anfrage darauf, ob ein authentication-token beigefügt ist.
  * @param context Der Context beinhält die 'native' Anfrage des Clients und Antwort des Backends, wenn diese bereits durchlaufen wurde.
  * @param next Das nächste Ergeignis, dass bei erfolgreicher Token validierung durchlaufen werden soll.
  * @returns Gibt das Ergebnis der Anfrage zurück. Dies kann der reguläre Antwortkörper oder ein Fehler sein.
  */
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Theoretisch JSON
    const headers = context.switchToHttp().getRequest().headers as any;

    // Abbrechen, wenn der Header-Authentication-Token nicht vorhanden ist.
    if (!headers.hasOwnProperty(AUTHENTICATION_HEADER_TOKEN))
      return this.unauthorizedError('Nicht authentifiziert.');

    const account = await this.jwtService.authenticated(headers[AUTHENTICATION_HEADER_TOKEN] as string);
    if(account == null)
      return this.unauthorizedError('Nicht authentifiziert.');
    if(!account.isAdmin)
      return throwError(() => new HttpException('Kein Admin',403));
    return next.handle();
  }
}
