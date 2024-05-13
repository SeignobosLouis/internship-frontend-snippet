export interface ITableColumn {
  name: string;
  group: number;
  visible: boolean;
}

export interface ITableColumns {
  [key: string]: ITableColumn;
}

export interface IDisplayedColumns {
  [key: string]: boolean;
}