import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {

 private _context?: string;

 /**
 * Setzt den Kontext dieses Loggers.
 */
 public set context(context: string){
   this._context = context;
 }

 public log(msg: any): void{
   Logger.log(msg,this._context);
 }

 public error(msg: any): void{
   Logger.error(msg,this._context);
 }

 public warn(msg: any): void{
   Logger.warn(msg,this._context);
 }

 public debug(msg: any): void{
   Logger.debug(msg,this._context);
 }
}
