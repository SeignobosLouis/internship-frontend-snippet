import { Injectable } from '@angular/core';
import { EventType, IPartialSitacMobile, ISitacConfig, ISitacData, ISitacMobile, ISitacSvgMobile } from '../interfaces/sitac-data.interface';
import { WebsocketService } from './websocket.service';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SitacBackendEventType } from '../types/sitac-backend-event.type';

@Injectable({
  providedIn: 'root'
})
export class SitacService {

  /**
   * Event emitter for mobiles update
   */
  public sitacMobilesUpdateEvent$ = new Subject<SitacBackendEventType>();

  /**
   * Event emitter for config update
   */
  public sitacConfigUpdateEvent$ = new Subject<ISitacConfig | void>();

  /**
   * Array containing the mobiles, possibly partially typed
   */
  public mobiles: Partial<ISitacMobile>[] | ISitacSvgMobile[] = [];

  /**
   * Constructor of the SitacService
   * Creating a websocket connection and subscribing to the events
   * @param websocketService Injected WebsocketService
   */
  constructor(private websocketService: WebsocketService) {
    this.websocketService.connect(environment.apiSocketUrl);
    this.websocketService.socket$.subscribe((data: ISitacData) => {
      if (!Object.values(EventType).includes(data.eventType)) throw new Error('Invalid eventType');
      this.handleEvent(data);
    });
  }

  /**
   * Method to handle the websocket events
   * @param data - The data of the event
   * @returns void
   */
  private handleEvent(data: ISitacData): void {
    switch (data.eventType) {
      case EventType.INITIAL_LOAD: {
        this.handleInitialLoadEvent(data);
        break;
      }
      case EventType.MOBILES_UPDATED: {
        this.handleUpdateEvent(data);
        break;
      }
      case EventType.SIMULATION_CONFIG_UPDATED: {
        this.handleConfigUpdateEvent(data);
        break;
      }
      case EventType.MOBILES_CREATED: {
        this.handleCreateEvent(data);
        break;
      }
      case EventType.MOBILES_DELETED: {
        this.handleDeleteEvent(data);
        break;
      }
    }
  }

  /**
   * Method to handle the initial load event
   * This method will initialize the mobiles and the config
   * And send the events to the subscribers (sitacMobilesUpdateEvent$, sitacConfigUpdateEvent$)
   * @param data - The data of the event
   * @returns void
   */
  private handleInitialLoadEvent(data: ISitacData): void {
    if (!data.config || !data.mobiles) throw new Error('Invalid config');
    // Send initialize event
    if (data.mobiles) {
      this.mobiles = Object.values(data.mobiles) as ISitacMobile[];
      this.sitacMobilesUpdateEvent$.next('INITIAL_LOAD');
    }
    this.sitacConfigUpdateEvent$.next(data.config);
  }

  /**
   * Method to handle the update event
   * This method will update the mobiles and send the event
   * to the subscribers (sitacMobilesUpdateEvent$)
   * @param data - The data of the event
   * @returns void
   */
  private handleUpdateEvent(data: ISitacData): void {
    const mobiles: { [mobileId: number]: ISitacMobile } | undefined = data.mobiles as { [mobileId: number]: ISitacMobile } | undefined;
    if (mobiles) {
      this.updateData(mobiles);
      this.sitacMobilesUpdateEvent$.next('MOBILES_UPDATED');
    }
  }

  /**
   * Method to handle the create event
   * This method will create the mobiles and send the event to
   * the subscribers (sitacMobilesUpdateEvent$, sitacConfigUpdateEvent$)
   * @param data - The data of the event
   * @returns void
   */
  private handleCreateEvent(data: ISitacData): void {
    const mobileCreation: { [mobileId: number]: ISitacMobile } | undefined = data.mobiles as { [mobileId: number]: ISitacMobile } | undefined;
    if (mobileCreation) {
      if (data.mobiles) {
        this.updateData(mobileCreation);
        this.sitacMobilesUpdateEvent$.next('MOBILES_CREATED');
        this.sitacConfigUpdateEvent$.next();
      }
    }
  }

  /**
   * Method to handle the config update event
   * This method will update the config and send the event to the subscribers (sitacConfigUpdateEvent$)
   * @param data - The data of the event
   * @returns void
   */
  private handleConfigUpdateEvent(data: ISitacData): void {
    if (!data.config) throw new Error('Invalid config');
    this.sitacConfigUpdateEvent$.next(data.config);
  }

  /**
   * Method to handle the delete event
   * This method will delete the mobiles and send
   * the event to the subscribers (sitacMobilesUpdateEvent$, sitacConfigUpdateEvent$)
   * @param data 
   */
  private handleDeleteEvent(data: ISitacData): void {
    if (data.mobiles) {
      const mobiles: string[] = Object.keys(data.mobiles as { [mobileId: number]: true });
      this.mobiles = this.mobiles.filter((mobile: Partial<ISitacMobile>) => !mobiles.includes(mobile.id!.toString()));
      this.sitacMobilesUpdateEvent$.next('MOBILES_DELETED');
      this.sitacConfigUpdateEvent$.next();
    }
  }

  /**
   * Method to update the data source based on the partial data
   * @param partialSitacData - The partial data of the event
   * @returns void
   */
  private updateData(partialSitacData: IPartialSitacMobile ): void {
    // Create index map for quick access to the mobiles
    const mobileIndexMap: { [mobileId: number]: number } = {};
    this.mobiles.forEach((mobile, index) => {
      if (!mobile.id) throw new Error('Invalid mobile');
      mobileIndexMap[mobile.id] = index;
    });

    // Update the data source based on the partial data
    for (const [mobileKey, value] of Object.entries(partialSitacData)) {
      const mobileIndex = mobileIndexMap[Number(mobileKey)];
      // If the mobile exists, update the mobile, else add the mobile to the data source
      if (mobileIndex !== undefined) {
        const targetMobile = this.mobiles[mobileIndex] as { [key: string]: any };
        for (const [key, nestedValue] of Object.entries(value)) {
          // If value is an object (like kinematics, extraMobileData1, extraMobileData2), merge the object, else update the value
          if (typeof nestedValue === 'object') {
            targetMobile[key] = { ...targetMobile[key], ...nestedValue };
          } else {
            targetMobile[key] = nestedValue;
          }
        }
        // Update the data source
        this.mobiles[mobileIndex] = targetMobile;
      } else {
        // Add the mobile to the data source. Create a copy of the data source to trigger the change detection in the table
        const dataSourceCopied = [... this.mobiles];
        dataSourceCopied.push({ ...value });
        this.mobiles = dataSourceCopied;
      }
    }
  }
}
