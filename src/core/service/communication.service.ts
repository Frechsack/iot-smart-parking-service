import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from "mqtt";
import { Subject } from 'rxjs';
import { InstructionMessage } from '../messages/instruction-message';
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
  private readonly instructionLaneSource = new Subject<InstructionMessage<any>>();

  /**
  * Observable mit allen per "instruction"-lane empfangenen Nachrichten. Der Inhalt der Nachrichten wurde noch nicht verarbeitet d.H. nicht in der Datenbank persistiert etc.
  * @deprecated Nachrichten auf der "instruction"-lane sollten nicht abgehört werden.
  */
  public readonly instructionLane = this.instructionLaneSource.asObservable();

  /**
  * Quelle für Nachrichten auf "status"-lane.
  */
  private readonly statusLaneSource = new Subject<StatusMessage<any>>();

  /**
  * Observable mit allen per "status"-lane empfangenen Nachrichten. Der Inhalt der Nachrichten wurde noch nicht verarbeitet d.H. nicht in der Datenbank persistiert etc.
  */
  public readonly statusLane = this.statusLaneSource.asObservable();

  /**
  * Quelle für Nachrichten auf "scan"-lane.
  */
  private readonly scanLaneSource = new Subject<ScanMessage>();

  /**
  * Observable mit allen per "scan"-lane empfangenen Nachrichten. Der Inhalt der Nachrichten wurde noch nicht verarbeitet d.H. nicht in der Datenbank persistiert etc.
  * @deprecated Nachrichten auf der "scan"-lane sollten nicht abgehört werden.
  */
  public readonly scanLane = this.scanLaneSource.asObservable();

  /**
  * Quelle für Nachrichten auf "register"-lane.
  */
  private readonly registerLaneSource = new Subject<RegisterMessage>();

  /**
  * Observable mit allen per "register"-lane empfangenen Nachrichten. Der Inhalt der Nachrichten wurde noch nicht verarbeitet d.H. nicht in der Datenbank persistiert etc.
  */
  public readonly registerLane = this.registerLaneSource.asObservable();


  constructor(
     configService: ConfigService,
     loggerService: LoggerService
   ){
    loggerService.context = CommunicationService.name;
    this.mqttClient = connect(`mqtt://${configService.get('MQTT_HOST')}:${configService.get('MQTT_PORT')}`,{keepalive: 10, reconnectPeriod: 1000});
    this.mqttClient.subscribe('instruction');
    this.mqttClient.subscribe('status');
    this.mqttClient.subscribe('scan');
    this.mqttClient.subscribe('register');

    this.mqttClient.on('message',(topic: string, message: Buffer) => {
      try {
        if(topic === 'instruction')
          this.instructionLaneSource.next(InstructionMessage.fromPayload(message.toString()));
        else if(topic === 'status')
          this.statusLaneSource.next(StatusMessage.fromPayload(message.toString()));
        else if(topic === 'scan')
          this.scanLaneSource.next(new ScanMessage());
        else if(topic === 'register')
          this.registerLaneSource.next(RegisterMessage.fromPayload(message.toString()));
      }
      catch (error){
        loggerService.warn(`Invalid message on lane: "${topic}", message: "${message.toString()}", error: "${error}"`);
      }
    });
  }

  /**
  * Verschickt per MQTT eine neue Anweisung.
  * @param mac Das Gerät, welches die Anweisung erhalten soll.
  * @param instruction Die zu sendende Anweisung.
  */
  public async sendInstruction(mac: string, instruction: any) {
    this.mqttClient.publish('instruction', `${mac}:${instruction}`);
  }

  /**
  * Verschickt per MQTT die Anweisung, alle Sensoren einzumessen. Die lane "register" sollte als Konsequenz auf diesen Aufruf abgehört werden.
  */
  public async scan() {
    this.mqttClient.publish('scan','');
  }

}
