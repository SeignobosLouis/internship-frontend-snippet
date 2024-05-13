import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  /**
   * Default number of sectors in the simulation
   */
  public static nbSectors: number = 7;

  /**
   * Default number of quarters in the simulation
   */
  public static nbQuarters: number = 12;

  /**
   * Default radius of the simulation
   */
  public static radius: number = 10000;

  /**
   * Defaults colors for the 4 intervals
   */
  public static intervalsColors: {min?: number, max?: number, color: string}[] = [
    { min: 0, max: 0, color: 'rgb(245, 245, 245)' },
    { min: 1, max: 3, color: 'rgb(120, 200, 245)' },
    { min: 4, max: 5, color: 'rgb(1, 160, 210)' },
    { min: 6, max: undefined, color: 'rgb(0, 50, 99)' },
  ];

  /**
   * Array of the distribution based on the intervals
   * For example, if intervalsColors is :
   * [
   *  { min: 0, max: 0, color: 'rgb(245, 245, 245)' },
   *  { min: 1, max: 3, color: 'rgb(120, 200, 245)' },
   *  { min: 4, max: 5, color: 'rgb(1, 160, 210)' },
   *  { min: 6, max: undefined, color: 'rgb(0, 50, 99)' }
   * ]
   * Then distribution will be [0, 3, 5] : the max value of each interval
   * (except if it's undefined, then it's not included in the array)
   * This array is used to display the distribution of the simulation
   */
  public static distribution: number[] = AppComponent.intervalsColors
    .filter(interval => interval.max !== undefined)
    .map(interval => interval.max as number);

  /**
   * The observer for the intersection of the charts
   */
  private intersectionObserver!: IntersectionObserver;

  /**
   * Flag to know if the charts are visible or not
   */
  public isWatchingCharts: boolean = false;

  /**
   * The zoom of the charts
   */
  public zoomCharts: number = 100;

  /**
   * Element ref containing the charts to observe
   */
  @ViewChild('chartObserver') chart!: ElementRef;

  constructor() {
    this.intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isWatchingCharts = true;
        } else {
          this.isWatchingCharts = false;
        }
      });
    });
  }

  public ngAfterViewInit(): void {
    this.intersectionObserver.observe(this.chart.nativeElement);
  }

}
