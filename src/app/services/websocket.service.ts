import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ISitacData } from '../interfaces/sitac-data.interface';

/**
 * Websocket Service
 * @description Service to handle the websocket connection
 */
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  /**
   * Websocket Subject (Observable)
   */
  public socket$!: WebSocketSubject<ISitacData>;

  /**
   * Method to connect to the websocket
   * @param url - The URL of the websocket
   */
  public connect(url: string): void {
    this.socket$ = webSocket(url);
  }
}