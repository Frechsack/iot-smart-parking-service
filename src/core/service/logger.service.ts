import { Injectable, Logger, Scope } from '@nestjs/common';

/**
* Loggerservice mit Nestjs integration.
*/
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {

 private _context?: string;

 /**
 * Setzt den Kontext dieses Loggers.
 */
 public set context(context: string){
   this._context = context;
 }

 /**
 * Gibt eine Nachricht ins Log aus.
 */
 public log(msg: any): void{
   Logger.log(msg,this._context);
 }

 /**
 * Gibt einen Fehler ins Log aus.
 */
 public error(msg: any): void{
   Logger.error(msg,this._context);
 }

 /**
 * Gibt eine Warnung ins Log aus.
 */
 public warn(msg: any): void{
   Logger.warn(msg,this._context);
 }

 /**
 * Gibt eine Debug-Nachricht ins Log aus.
 */
 public debug(msg: any): void{
   Logger.debug(msg,this._context);
 }
}
