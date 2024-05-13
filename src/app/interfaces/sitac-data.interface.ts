export interface ISitacEventData {
  type: IEventTypeData;
  data: ISitacData;
}

export interface ISitacConfig {
  centerX: number;
  centerY: number;
  maxMobileDistanceFromCenterM: number;
  isSimulationRunning: boolean;
  updatePeriodMs: number;
  mobiles: number;
}

export interface IKinematics {
  headingRad?: number;
  xM: number;
  yM: number;
  zM?: number;
  speedMS?: number;
  orientationRad: number;
  spinningSpeedRadS?: number;
}

export interface IPartialSitacMobile {
  [key: number]: Partial<ISitacMobile>;
}

export interface ISitacSvgMobile extends ISitacMobile {
  diagramX?: number;
  diagramY?: number;
  trianglePoints?: string;
  topLeftPointXCoordinate?: number;
  topLeftPointYCoordinate?: number;
  diamondPoints?: string;
  arrowSecondXCoordinate?: number;
  arrowSecondYCoordinate?: number;
  orientationSecondXCoordinate?: number;
  orientationSecondYCoordinate?: number;
  squareSecondXCoordinate?: number;
  squareSecondYCoordinate?: number;
  isDisplayed?: boolean;
  isOutOfRange?: boolean;
  headingDeg?: number;
  orientationDeg?: number;
  spinningSpeedRedS?: number;
  speedMSfixedTwo?: number;
  fixedTwoX?: number;
  fixedTwoY?: number;
  isSelected?: boolean;
}

export interface ISitacMobile {
  id: number;
  displayId?: string;
  shape?: string;
  color?: string;
  environment?: string;
  creationTimestampMs?: number;
  updateTimestampMs: number;
  kinematics: IKinematics;
  extraMobileData1?: {
    data1: number;
    data2: number;
    data3: string;
    data4: number;
    data5: number;
    data6: string;
    data7: number;
    data8: boolean;
  };
  extraMobileData2?: {
    data1: number;
    data2: number;
    data3: string;
    data4: number;
    data5: number;
    data6: string;
    data7: number;
    data8: boolean;
  }

}

export interface ISitacData {
  eventType: IEventTypeData;
  config?: ISitacConfig;
  mobiles?: {
    [mobileId: number]: ISitacMobile | boolean;
  };
  timestampMs: number;
}

export enum EventType {
  INITIAL_LOAD = 'INITIAL_LOAD',
  MOBILES_CREATED = 'MOBILES_CREATED',
  MOBILES_UPDATED = 'MOBILES_UPDATED',
  MOBILES_DELETED = 'MOBILES_DELETED',
  SIMULATION_CONFIG_UPDATED = 'SIMULATION_CONFIG_UPDATED'
}


export type IEventTypeData = EventType.INITIAL_LOAD | EventType.MOBILES_CREATED | EventType.MOBILES_UPDATED | EventType.MOBILES_DELETED | EventType.SIMULATION_CONFIG_UPDATED;
