import { Controller, Get, Param, Query } from '@nestjs/common';
import { DeviceDto } from '../dto/device-dto';
import { DeviceService } from '../service/device.service';

/**
* Restschnittstelle für alle Geräte bezogenen Aktionen.
*/
@Controller('devices')
export class DeviceController {

  constructor(
    private readonly deviceService: DeviceService
  ){}

  /* Erläuterungen:
  @Get(): Methoden können anotiert werden. Eine solche Funktion kann per HTTP-Get aufgrufen werden.
          Analog gibt es also auch @Put(), @Delete() oder @Post(). Diese benötigen wir aber noch nicht.
          Die Annotation kann einen parameter beinhalten z.B. @Get('test') oder @Get(':hilfe').
          Im Fall eins stellt 'test' die Route dar. Die Funktion kann unter dem Pfad: 'devices/test' aufgerufen werden.
          Im Fall zwei stellt ':hilfe' einen variablen Routen-Parameter dar. Die Funktion kann z.B. unter dem Pfad:
            'devices/name' oder 'devices/ftl' aufgerufen werden.
            Sowohl 'name' und 'ftl' können unter dem Alias 'test' ausgelesen werden.
            Dies wird z.B. in der Funktion getOne benötigt.
          Beide Fälle können auch kombinert werden: @Get('devices/first/:param').
          Diese Route kann sowohl über 'devices/first/hallelulia' oder 'devices/first/keinelust' erreicht werden.
  @Param(): Im Code möchte man einen Routen-Parameter auslesen können (reminder: @Get('devices/first/:param')).
          Der Parameter kann über @Param('param') ausgelesen werden.
          Beispiel: Routendefinition mit @Get('hallo/:add').
          Mit der Annotation @Param('add') kann der tatsächliche Wert des Parameters ausgelesen werden.
  @Query(): HTTP-Routen können auch zusätzliche Query-Parameter haben. Ein Query-Parameter ist immer optional,
          muss also nicht zwingend gesetzt sein.
          Ein Query-Parameter kann per @Query('name') ausgelesen werden.
          Beispiel: Die HTTP-Get Anfrage lautet /devices/rambock?add=1.
          Der Query-Parameter kann mit @Query('add') ausgelesen werden. Da der Query-Parameter optional ist,
          sollte im Code immer ein Standartwert gesetzt sein.

  Beispiele:

  Definition: @Get('/devices/notes/:id')
  Anfrage A: 'devices/notes/1' --> @Param('id') = 1
  Anfrage B: 'devices/notes/2?add=0' --> @Param('id') = 2, @Query('add') = 0
  Anfrage C: 'devices/notes/Hello?remove=1' --> @Param('id') = 'Hello', @Query('remove') = 1

  */

  /**
  * Gibt alle Geräte zurück.
  * @param page Die abzufragende Seite.
  * @param pageSize Die Anzahl an Elementen pro Seite.
  * @returns Gibt die Geräte zurück.
  */
  @Get()
  public async get(@Query('page') page: number = 0,@Query('pageSize') pageSize: number = 20): Promise<DeviceDto[]>{
    return this.deviceService.getDevices(page,pageSize);
  }

  /**
  * Gibt ein einzelnes Gerät zurück.
  * @param mac Die mac des abzufragenden Geräts.
  * @returns Gibt das Gerät zurück.
  */
  @Get(':mac')
  public async getOne(@Param('mac') mac: string): Promise<DeviceDto> {
    return this.deviceService.getDevice(mac);
  }

  // TODO: getStatus
  // @Query('page') page: number = 0,@Query('pageSize') pageSize: number = 20) Fehlt?
  @Get(':status')
  public async getStatus(@Param('status') status: string): Promise<DeviceDto> {
    return this.deviceService.getDevice(status);
  }

  // TODO: getInstructions
  //@Query('page') page: number = 0,@Query('pageSize') pageSize: number = 20) Fehlt?
  @Get(':instructions')
  public async getInstructions(@Param('instructions') instructions: string): Promise<DeviceDto> {
    return this.deviceService.getDevice(instructions);
  }

  // Die Eigenschaften der Methoden (Route-Parameter und Query-Parameter) können aus Postman entnommen werden.
}
