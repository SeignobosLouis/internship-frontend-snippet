import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { SitacService } from 'src/app/services/sitac.service';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { ISitacMobile } from 'src/app/interfaces/sitac-data.interface';
import { MatSort } from '@angular/material/sort';
import { ITableColumns } from 'src/app/interfaces/table.interface';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table.component.scss'
})
export class TableComponent implements OnInit {

  /**
   * Columns configuration
   */
  public columns: ITableColumns = {
    'id': {name: 'ID', group: 1, visible: true},
    'shape': {name: 'Forme', group: 1, visible: true},
    'color': {name: 'Couleur', group: 1, visible: true},
    'environment': {name: 'Environnement', group: 1, visible: true},
    'creationTimestampMs': {name: 'Création', group: 1, visible: true},
    'updateTimestampMs': {name: 'Mise à jour', group: 1, visible: true},
    'kinematics.headingRad': {name: 'Cap (rad)', group: 2, visible: true},
    'kinematics.xM': {name: 'xM', group: 2, visible: true},
    'kinematics.yM': {name: 'yM', group: 2, visible: true},
    'kinematics.zM': {name: 'zM', group: 2, visible: true},
    'kinematics.speedMS': {name: 'Vitesse (m/s)', group: 2, visible: true},
    'kinematics.orientationRad': {name: 'Orientation (rad)', group: 2, visible: true},
    'kinematics.spinningSpeedRadS': {name: 'Vitesse de rotation (rad/s)', group: 2, visible: true},
    'extraMobileData1.data1': {name: 'Donnée 1', group: 3, visible: true},
    'extraMobileData1.data2': {name: 'Donnée 2', group: 3, visible: true},
    'extraMobileData1.data3': {name: 'Donnée 3', group: 3, visible: true},
    'extraMobileData1.data4': {name: 'Donnée 4', group: 3, visible: true},
    'extraMobileData1.data5': {name: 'Donnée 5', group: 3, visible: true},
    'extraMobileData1.data6': {name: 'Donnée 6', group: 3, visible: true},
    'extraMobileData1.data7': {name: 'Donnée 7', group: 3, visible: true},
    'extraMobileData1.data8': {name: 'Donnée 8', group: 3, visible: true},
    'extraMobileData2.data1': {name: 'Donnée 1', group: 4, visible: true},
    'extraMobileData2.data2': {name: 'Donnée 2', group: 4, visible: true},
    'extraMobileData2.data3': {name: 'Donnée 3', group: 4, visible: true},
    'extraMobileData2.data4': {name: 'Donnée 4', group: 4, visible: true},
    'extraMobileData2.data5': {name: 'Donnée 5', group: 4, visible: true},
    'extraMobileData2.data6': {name: 'Donnée 6', group: 4, visible: true},
    'extraMobileData2.data7': {name: 'Donnée 7', group: 4, visible: true},
    'extraMobileData2.data8': {name: 'Donnée 8', group: 4, visible: true}
  };

  @Output() public selectMobileEvent: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Displayed Columns
   */
  public displayedColumns: string[] = Object.keys(this.columns).filter(column => this.columns[column].visible);

  /**
   * Compare key value without sort (override default compare function from MatTableDataSource)
   */
  public compareKeyValueWithoutSort(): number { return 0; }

  /**
   * Colspan lengths
   */
  public colspanLengths: { [key: number]: number } = {};

  /**
   * Header row definition (group names)
   */
  public headerRowDef: string[] = [];

  /**
   * Group columns that will be used to group the columns
   * Format: {groupId: 'group name'}
   */
  public groupColumns: {[key: number]: string} = {
    1: 'Données',
    2: 'Cinématiques',
    3: 'Données additionnelles 1',
    4: 'Données additionnelles 2'
  };

  /**
   * Boolean to check if the modal is active
   */
  public activeModal = false;

  /**
   * Table data source with virtual scroll that will be used to display the data
   */
  public dataSource = new TableVirtualScrollDataSource<ISitacMobile>();

  /**
   * The selected mobile id. If null, no mobile is selected
   */
  public selectedMobileId: number | null = null;

  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  /**
   * Get the nested property of the data. Used to sort the data source
   * @param data Data to get the nested property from
   * @param sortHeaderId Sort header id
   * @returns the nested property
   */
  private nestedProperty = (data: any, sortHeaderId: string) => {
    return sortHeaderId
      .split('.')
      .reduce((accumulator, key) => accumulator && accumulator[key], data)
  };

  /**
   * Constructor of the TableComponent
   * @param sitacService Injected SitacService
   * @param cdr Injected ChangeDetectorRef
   * @param renderer Injected Renderer2
   */
  constructor(
    private sitacService: SitacService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ){
    this.dataSource.sortingDataAccessor = this.nestedProperty;
  }

  /**
   * Angular OnInit lifecycle hook
   * Subscribe to the sitacEvents to update the data source
   * @returns void
   */
  public ngOnInit(): void {
    this.updateColspanLengths();
    this.setHeaderRowDef();
    this.dataSource.filterPredicate = this.customFilterPredicate;
    this.subscribeToEvents();
  }

  /**
   * Set the header row definition based on the group columns
   * @returns void
   */
  private setHeaderRowDef(): void {
    const headerRowDef: string[] = [];
    for (const key in this.groupColumns) {
      // Format the group name to be used as a class name
      const currentGroupColumn: string = this.groupColumns[key].toLowerCase().replace(' ', '');
      headerRowDef.push(currentGroupColumn);
    }
    this.headerRowDef = headerRowDef;
  }

  public selectMobile(mobile: number): void {
    this.selectedMobileId = this.selectedMobileId === mobile ? null : mobile;
  }

  public emitSelectMobileEvent(mobile: ISitacMobile): void {
    this.selectMobileEvent.emit(mobile.id);
  }

  /**
   * Subscribe to the sitac events to update the data source
   * @returns void
   */
  private subscribeToEvents(): void {
    this.sitacService.sitacMobilesUpdateEvent$.subscribe((eventType) => {
      if (eventType === 'INITIAL_LOAD' || eventType === 'MOBILES_CREATED' || eventType === 'MOBILES_DELETED') {
        this.dataSource.data = this.sitacService.mobiles as ISitacMobile[];
      }
      this.detectChanges();
    });
  }

  /**
   * Update the colspan lengths based on the displayed columns
   * This method is called when the columns are updated
   * @returns void
   */
  private updateColspanLengths(): void {
    const columns = this.displayedColumns;
    for (const group in this.groupColumns) {
      const groupValue: number = parseInt(group);
      const columnsInGroup: string[] = columns.filter(column => this.columns[column].group === groupValue);
      this.colspanLengths[groupValue] = columnsInGroup.length;
    }
  }

  /**
   * Detect changes in the component to update the view
   * @returns void
   */
  private detectChanges(): void {
    this.cdr.detectChanges();
  }

  /**
   * Toggle the modal
   * @returns void
   */
  public toggleModal(): void {
    if (this.activeModal) this.renderer.removeClass(document.body, 'modal-open');
    else this.renderer.addClass(document.body, 'modal-open');
    this.activeModal = !this.activeModal;
  }

  /**
   * Toggle the column visibility based on the column name
   * @param column Column to toggle
   * @returns void
   */
  public toggleColumn(column: string): void {
    this.columns[column].visible = !this.columns[column].visible;
    this.displayedColumns = Object.keys(this.columns).filter(column => this.columns[column].visible);
    this.updateColspanLengths();
    this.detectChanges();
  }

  /**
   * Apply the filter to the data source
   * @param event An event which takes place in the DOM.
   * @returns void
   */
  public applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Override the default filter predicate to filter the data source
   * @param data Data to filter
   * @param filter Filter value
   * @returns boolean
   */
  private customFilterPredicate(data: Partial<ISitacMobile>, filter: string): boolean {
    // Instanciate the data to avoid modifying the original data
    const instanciedData: { [key: string]: string | number | object | undefined | boolean } = {...data};
    if (data.creationTimestampMs && data.updateTimestampMs) {
      // Format the date to be able to filter the date
      instanciedData['creationTimestampMs'] = new Date(data.creationTimestampMs).toLocaleString();
      instanciedData['updateTimestampMs'] = new Date(data.updateTimestampMs).toLocaleString();
    }
    const dataString: string = JSON.stringify(instanciedData).toLowerCase();
    const filterValue: string = filter.trim().toLowerCase();
    return dataString.includes(filterValue);
  }

}
