import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from "mqtt";
import { filter, Subject } from 'rxjs';
import { InstructionMessage } from '../messages/instruction-message';
import { MessageSource } from '../messages/message';
import { RegisterMessage } from '../messages/register-message';
import { ScanMessage } from '../messages/scan-message';
import { StatusMessage } from '../messages/status-message';
import { LoggerService } from './logger.service';

/**
* Empfängt Nachrichten und Anweisungen per MQTT.
*/
@Injectable()
export class CommunicationService {

  /**
  * Client für die MQTT-Kommunikation.
  */
  private readonly mqttClient: MqttClient;

  /**
  * Quelle für Nachrichten auf "instruction"-lane.
  */
  public readonly instructionLane = new Subject<InstructionMessage<any>>();

  /**
  * Quelle für Nachrichten auf "status"-lane.
  */
  public readonly statusLane = new Subject<StatusMessage<any>>();

  /**
  * Quelle für Nachrichten auf "scan"-lane.
  */
  public readonly scanLane = new Subject<ScanMessage>();

  /**
  * Quelle für Nachrichten auf "register"-lane.
  */
  public readonly registerLane = new Subject<RegisterMessage>();


  constructor(
     configService: ConfigService,
     loggerService: LoggerService
   ){
    loggerService.context = CommunicationService.name;
    this.mqttClient = connect(`mqtt://${configService.get('MQTT_HOST')}:${configService.get('MQTT_PORT')}`,{ keepalive: 10, reconnectPeriod: 1000, protocolVersion: 5 });
    this.mqttClient.subscribe('instruction', { nl: true, qos: 0 });
    this.mqttClient.subscribe('status', { nl: true, qos: 0 });
    this.mqttClient.subscribe('scan', { nl: true, qos: 0 });
    this.mqttClient.subscribe('register', { nl: true, qos: 0 });

    // Wandel extern empfangende Nachrichten per MQTT in Messages um.
    this.mqttClient.on('message',(topic: string, message: Buffer) => {
      try {
        if(topic === 'instruction')
          this.instructionLane.next(InstructionMessage.fromPayload(message.toString(),MessageSource.EXTERNAL));
        else if(topic === 'status')
          this.statusLane.next(StatusMessage.fromPayload(message.toString(),MessageSource.EXTERNAL));
        else if(topic === 'scan')
          this.scanLane.next(new ScanMessage(MessageSource.EXTERNAL));
        else if(topic === 'register')
          this.registerLane.next(RegisterMessage.fromPayload(message.toString(),MessageSource.EXTERNAL));
      }
      catch (error){
        loggerService.warn(`Invalid message on lane: "${topic}", message: "${message.toString()}", error: "${error}"`);
      }
    });

    // Wandel interne Nachrichten in MQTT-Nachrichten um.
    this.instructionLane.pipe(filter(it => it.isInternalMessage()))
      .subscribe(it => this.mqttClient.publish('instruction',`${it.mac}:${it.instruction}`));
    this.statusLane.pipe(filter(it => it.isInternalMessage()))
      .subscribe(it => this.mqttClient.publish('status',`${it.mac}:${it.status}`));
    this.registerLane.pipe(filter(it => it.isInternalMessage()))
      .subscribe(it => this.mqttClient.publish('register',`${it.mac}:${it.deviceType}:${it.parkingLotNr}:${it.parentDeviceMac}`));
  //  this.instructionLane.pipe(filter(it => it.isInternalMessage()))
  //    .subscribe(() => this.mqttClient.publish('scan',''));
  }

  public async sendInstruction(mac: string, instruction: any): Promise<void> {
    const message = new InstructionMessage(mac,`${instruction}`.toLowerCase(),MessageSource.INTERNAL);
    this.instructionLane.next(message);
  }
}
