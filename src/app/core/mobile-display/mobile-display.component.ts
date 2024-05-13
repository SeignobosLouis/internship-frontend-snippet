import { Component, OnInit, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { SitacService } from 'src/app/services/sitac.service';
import {  ISitacMobile, ISitacSvgMobile } from 'src/app/interfaces/sitac-data.interface';
import { SitacBackendEventType } from 'src/app/types/sitac-backend-event.type';
import { ChartComponent } from '../chart/chart.component';
import { MathUtils } from 'src/app/utils/math-utils';
import { AppComponent } from '../app/app.component';
import { IColorFilter, IDisplayMobileOptions } from 'src/app/interfaces/mobile-display.interface';

@Component({
  selector: 'app-mobile-display',
  templateUrl: './mobile-display.component.html',
  styleUrls: ['./mobile-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDisplayComponent implements OnInit {

  /**
   * The chart component
   */
  @ViewChild('myChart') chartComponent!: ChartComponent;

  /**
   * The svg element
   */
  @ViewChild('svgElement') svgElement!: ElementRef;

  /**
   * The flag to know if the chart is visible or not
   */
  @Input() isWatching: boolean = false;

  /**
   * The event emitter to send the
   * selected mobile to other components
   */
  @Output() selectMobileEvent: EventEmitter<ISitacSvgMobile> = new EventEmitter<ISitacSvgMobile>();

  /**
   * The event emitter to send the
   * updated mobile to other components
   */
  @Output() updateMobileEvent: EventEmitter<ISitacSvgMobile> = new EventEmitter<ISitacSvgMobile>();

  /**
   * The event emitter to update the
   * mobile detail component
   */
  @Output() updateMobileDetail: EventEmitter<void> = new EventEmitter<void>();

  /**
   * The flag to know if the chart is in full screen mode or not
   */
  public fullScreen: boolean = false;

  /**
   * The zoom level of the chart
   */
  private zoom: number = 1;
  
  /**
   * The previous selected mobile
   */
  private previousSelectedMobile: ISitacSvgMobile | null = null;

  /**
   * The size of the arrow
   */
  private readonly arrowSize: number = 12;

  /**
   * The size of the orientation segment
   */
  private readonly orientationSegmentSize: number = 9;

  /**
   * The size of the square side
   */
  public readonly squareSideSize: number = 10;

  /**
   * The size of the triangle side
   */
  private readonly triangleSideSize: number = 10;

  /**
   * The size of the diamond side
   */
  private readonly diamondSideSize: number = 10;

  /**
   * The max range of the chart
   */
  private maxRange: number = AppComponent.radius;

  /**
   * The selected mobile
   */
  public selectedMobile: ISitacSvgMobile | null = null;

  /**
   * The options to display the mobiles
   */
  public options: IDisplayMobileOptions = {
    showBlue: true,
    showViolet: true,
    showRed: true,
    showOrange: true,
    showYellow: true,
    showGreen: true,
    showCircle: true,
    showSquare: true,
    showTriangle: true,
    showDiamond: true
  };

  /**
   * Mobiles data source
   */
  public mobiles: Partial<ISitacSvgMobile>[] = [];

  /**
   * Constructor of the mobileDisplayComponent
   * @param sitacService Injected SitacService
   * @param cdr Injected ChangeDetectorRef
   */
  constructor(private sitacService: SitacService, private cdr: ChangeDetectorRef) { }

  /**
   * Angular OnInit lifecycle hook
   * Subscribe to the sitacEvents to update the data source
   * @returns void
   */
  ngOnInit(): void {
    this.subscribeToEvents();
  }

  /**
   * Toggle the full screen mode
   * @returns void
   */
  public toggleFullScreen(): void {
    this.fullScreen = !this.fullScreen;
    this.chartComponent.toggleFullScreen();
    this.cdr.detectChanges();
  }

  /**
   * Update the selected mobile
   * @returns void
   */
  public updateSelectMobile(): void {
    if (this.selectedMobile) {
      this.updateMobileEvent.emit(this.selectedMobile);
    }
  }

  /**
   * Update the zoom of the chart
   * @param zoom the zoom level (in percentage)
   * @returns void
   */
  public updateZoom(zoom: number): void {
    this.chartComponent.updateZoom(zoom);
    this.zoom = 1 / (zoom / 100);
  }

  /**
   * Update the radius of the chart
   * @param radius the radius
   * @returns void
   */
  public updateRadius(radius: number): void {
    this.maxRange = radius;
    this.chartComponent.updateRadius(radius);
  }

  /**
   * Verify if the mobile is displayed
   * (only based on the options selected by the
   * user in the filter like color and shape)
   * @param mobile the mobile
   * @returns boolean if the mobile is displayed
   */
  private checkIfMobileselectedMobile(mobile: ISitacSvgMobile): boolean {
    const colorFilters: IColorFilter = {
      'BLUE': this.options.showBlue,
      'VIOLET': this.options.showViolet,
      'RED': this.options.showRed,
      'ORANGE': this.options.showOrange,
      'YELLOW': this.options.showYellow,
      'GREEN': this.options.showGreen
    };
    const shapeFilters: IColorFilter = {
      'CIRCLE': this.options.showCircle,
      'SQUARE': this.options.showSquare,
      'TRIANGLE': this.options.showTriangle,
      'DIAMOND': this.options.showDiamond
    };
    if (!colorFilters[mobile.color!] || !shapeFilters[mobile.shape!]) return false;
    else return true;
  }
  
  /**
   * Subscribe to the sitac events to update the chart
   * @returns void
   */
  private subscribeToEvents(): void {
    this.sitacService.sitacMobilesUpdateEvent$.subscribe((eventType: SitacBackendEventType) => {
      if (!this.isWatching && eventType === 'MOBILES_UPDATED') return; // The chart is not visible, we don't update it
      const currentMobiles: Partial<ISitacMobile>[] = this.sitacService.mobiles;
      this.mobiles = currentMobiles;
      if (eventType === 'INITIAL_LOAD' || eventType === 'MOBILES_UPDATED' || eventType === 'MOBILES_CREATED') {
        // We need to update the mobiles if they are visible
        this.mobiles.forEach(mobile => {
          const checkIfMobileselectedMobile: boolean = this.checkIfMobileselectedMobile(mobile as ISitacSvgMobile);
          if (checkIfMobileselectedMobile === true) {
            mobile.isDisplayed = true;
            if (this.calculateIsOutOfRange(mobile.kinematics!.xM, mobile.kinematics!.yM) === true) {
              mobile.isOutOfRange = true;
            } else {
              mobile.isOutOfRange = false;
              this.addPropertiesToMobile(mobile as ISitacSvgMobile);
            }
          } else {
            mobile.isDisplayed = false;
          }
        });
        // Notify mobile display component each time a mobile is selected
        if (this.selectedMobile) {
          this.updateMobileDetail.emit();
        }
        // Detecting changes to update the view
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Adapts the cx field calculated from the mobile's xM field to the size of the viewbox svg container then return it
   * @param x number
   * @returns number
   */
  private convertX(x: number): number {
    return (x * 250) / (this.maxRange * this.zoom);
  }

  /**
   * Adapts the cy field calculated from the mobile's xM field to the size of the viewbox svg container then return it
   * @param y number
   * @returns number
   */
  private convertY(y: number): number {
    return (y * 250) / (this.maxRange * this.zoom);
  }

  /**
   * Calculate if the mobile is out of range adapted to the zoom
   * @param xM x coordinate of the mobile
   * @param yM y coordinate of the mobile
   * @returns boolean if the mobile is out of range
   */
  private calculateIsOutOfRange(xM: number, yM: number): boolean {
    return MathUtils.calculateEuclideanDistanceFromOrigin(xM, yM) > this.maxRange * this.zoom;
  }

  /**
   * Fill the mobile with the properties needed to display it
   * The properties are:
   * - diagramX
   * - diagramY
   * - trianglePoints
   * - topLeftPointXCoordinate
   * - topLeftPointYCoordinate
   * - diamondPoints
   * - arrowSecondXCoordinate
   * - arrowSecondYCoordinate
   * - orientationSecondXCoordinate
   * - orientationSecondYCoordinate
   * - headingDeg
   * - orientationDeg
   * - spinningSpeedRedS
   * - speedMSfixedTwo
   * - fixedTwoX
   * - fixedTwoY
   * @param mobile the mobile to fill
   * @returns void
   */
  private addPropertiesToMobile(mobile: ISitacSvgMobile): void {
    mobile.diagramX = this.convertX(mobile.kinematics.xM);
    mobile.diagramY = this.convertY(mobile.kinematics.yM);
    switch (mobile.shape) {
      case 'TRIANGLE': {
        mobile.trianglePoints = this.calculateTrianglePoints(mobile.diagramX, mobile.diagramY, this.triangleSideSize);
        break;
      }
      case 'SQUARE': {
        mobile.topLeftPointXCoordinate = mobile.diagramX - this.squareSideSize / 2;
        mobile.topLeftPointYCoordinate = mobile.diagramY - this.squareSideSize / 2;
        break;
      }
      case 'DIAMOND': {
        mobile.diamondPoints = this.calculateDiamondPoints(mobile.diagramX, mobile.diagramY, this.diamondSideSize);
        break;
      }
    }
    // Calculate all the points for the arrow and the orientation segment
    mobile.arrowSecondXCoordinate = this.calculateX2LinePoint(mobile.diagramX, this.arrowSize, mobile.kinematics.headingRad);
    mobile.arrowSecondYCoordinate = this.calculateY2LinePoint(mobile.diagramY, this.arrowSize, mobile.kinematics.headingRad);
    mobile.orientationSecondXCoordinate = this.calculateX2LinePoint(mobile.diagramX, this.orientationSegmentSize, mobile.kinematics.orientationRad);
    mobile.orientationSecondYCoordinate = this.calculateY2LinePoint(mobile.diagramY, this.orientationSegmentSize, mobile.kinematics.orientationRad);

    // Calculate data converted only if mobile is selected
    if (this.selectedMobile?.id === mobile.id) {
      mobile.headingDeg = this.toFixedTwo(MathUtils.convertRadiansToDegrees(mobile.kinematics.headingRad));
      mobile.orientationDeg = this.toFixedTwo(MathUtils.convertRadiansToDegrees(mobile.kinematics.orientationRad));
      mobile.spinningSpeedRedS = this.toFixedTwo(MathUtils.convertRadiansToDegrees(mobile.kinematics.spinningSpeedRadS));
      mobile.speedMSfixedTwo = this.toFixedTwo(mobile.kinematics.speedMS);
      mobile.fixedTwoX = this.toFixedTwo(mobile.kinematics.xM);
      mobile.fixedTwoY = this.toFixedTwo(mobile.kinematics.yM);
    }
  }

  /**
   * Calculate the top points of the triangle
   * @param x x coordinate of the triangle's center
   * @param y y coordinate of the triangle's center
   * @param size size of the triangle's sides
   * @returns string the points of the triangle
   */
  private calculateTrianglePoints(x: number, y: number, size: number): string {
    const x1 = x; // x coordinate of the top vertex of the triangle
    const y1 = y - size / Math.sqrt(3); // y coordinate of the top vertex of the triangle
    const x2 = x - size / 2; // x coordinate of the bottom left vertex of the triangle
    const y2 = y + size / (2 * Math.sqrt(3)); // y coordinate of the bottom left vertex of the triangle
    const x3 = x + size / 2; // x coordinate of the bottom right vertex of the triangle
    const y3 = y + size / (2 * Math.sqrt(3)); // y coordinate of the bottom right vertex of the triangle
    return `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
  }

  /**
   * Calculate the top points of the diamond
   * @param x x coordinate of the diamond's center
   * @param y y coordinate of the diamond's center
   * @param size size of the diamond's sides
   * @returns string the points of the diamond
   */
  private calculateDiamondPoints(x: number, y: number, size: number): string {
    const halfSize = size / 2;
    const points = [
      `${x},${y - halfSize}`, // superior point
      `${x + halfSize},${y}`, // right point 
      `${x},${y + halfSize}`, // bottom point 
      `${x - halfSize},${y}` // left point
    ];
    return points.join(' ');
  }

  /**
   * Calculate the x2 line point
   * @param firstX x coordinate of the first point
   * @param arrowSize size of the arrow
   * @param headingRad the heading in radians
   * @returns number the x coordinate of the second point
   */
  private calculateX2LinePoint(firstX: number, arrowSize: number, headingRad: number | undefined): number {
    if (headingRad !== undefined) return firstX + arrowSize * Math.cos(headingRad - MathUtils.DEGREES_90_IN_RADIANS);
    else return 0;
  }

  /**
   * Calculate the y2 line point
   * @param firstY y coordinate of the first point
   * @param arrowSize size of the arrow
   * @param headingRad the heading in radians
   * @returns number the y coordinate of the second point
   */
  private calculateY2LinePoint(firstY: number, arrowSize: number, headingRad: number | undefined): number {
    if (headingRad !== undefined) return firstY - arrowSize * Math.sin(headingRad - MathUtils.DEGREES_90_IN_RADIANS);
    else return 0;
  }

  /**
   * Select a mobile by its id
   * @param mobileId the id of the mobile
   * @returns void
   */
  public selectMobile(mobileId: number): void {
    const mobile = this.mobiles.find(mobile => mobile.id === mobileId);
    if (mobile !== undefined) this.onMobileClick(mobile);
  }

  /**
   * Select (or unselect) a mobile by clicking on it
   * This method is called when the user clicks on a mobile
   * and it will emit the selected mobile to the other components
   * @param mobile the mobile
   * @returns void
   */
  public onMobileClick(mobile: Partial<ISitacSvgMobile>): void {
    if (this.selectedMobile === mobile) {
      this.selectMobileEvent.emit(mobile as ISitacSvgMobile);
      this.chartComponent.resetBorderDatasets();
      this.selectedMobile = null;
      mobile.isSelected = false;
      this.previousSelectedMobile = null;
    } else {
      this.selectMobileEvent.emit(mobile as ISitacSvgMobile);
      this.selectedMobile = mobile as ISitacSvgMobile;
      if (this.previousSelectedMobile) this.previousSelectedMobile.isSelected = false;
      mobile.isSelected = true;
      this.previousSelectedMobile = mobile as ISitacSvgMobile;
    }
  }

  /**
   * Round a number to two decimal places
   * @param num the number to round
   * @returns number the rounded number or 0 if the number is undefined
   */
  private toFixedTwo(num: number | undefined): number {
    if (num) return parseFloat(num.toFixed(2));
    else return 0;
  }
}