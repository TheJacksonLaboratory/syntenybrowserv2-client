import { ClrDatagridComparatorInterface, ClrDatagridPagination } from '@clr/angular';
import { format } from 'd3-format';
import {
  ChrComparator,
  DescendantsComparator,
  IDComparator,
  NameComparator,
  SymbolComparator,
  TypeComparator,
} from './comparators';
import { Feature } from './feature';

export class TableData<T> {
  // indicates if the table is still waiting for data to load into the datagrid
  loading: boolean;

  // list of all features or ontology terms
  rows: T[] = [];

  // list of all visible features (responds to filtering/searching)
  filteredRows: T[] = [];

  // columns needed to display in the datagrid
  columns: string[];

  // subset of columns that should be searched for filter matches
  searchableColumns: string[];

  // indicates if the user is utilizing dragging to select rows in the table
  dragging = false;

  // while dragging, controls if the user is selecting or deselecting rows
  dragMode: string = null;

  // selected features (only features are stored in the selections array; while users can
  // "select" an ontology term, by doing so, they are selecting all genes associated
  // with that term)
  selections: Feature[] = [];

  // sorts features or ontology terms by ID
  idComp = new IDComparator();

  // sorts features by symbol
  symbolComp = new SymbolComparator();

  // sorts features by type
  typeComp = new TypeComparator();

  // sorts features by chromosome it's located on
  chrComp = new ChrComparator();

  // sorts ontology terms by the number of descendant terms it has
  descComp = new DescendantsComparator();

  // sorts ontology terms by term name
  nameComp = new NameComparator();

  constructor(columns: string[], searchable: string[]) {
    this.loading = false;
    this.columns = columns;
    this.searchableColumns = searchable;
  }

  /**
   * Sets the rows (and filtered rows) of the table and sorts the rows if a
   * sortOn parameter is specified, and stops the loading
   * @param {OntologyTerm[]|Feature[]} rows - rows for the table which may be
   *                              ontology terms or features depending on the table
   */
  setRows(rows: T[]): void {
    this.rows.push(...rows);
    this.filteredRows.push(...rows);
  }

  /**
   * Clears the table data completely
   */
  clear(): void {
    this.rows = [];
    this.filteredRows = [];
  }

  /**
   * Uses the specified search string to filter the rows in the table to those
   * only that match in at least one column
   * @param {string} search - the search string to use to filter the table rows
   */
  searchFor(search: string): void {
    if (search === '') {
      this.filteredRows = this.rows;
    } else {
      this.filteredRows = this.rows.filter(r => {
        for (let i = 0; i < this.searchableColumns.length; i += 1) {
          const column = r[this.searchableColumns[i]].toString().toLowerCase();
          if (column.includes(search.toLowerCase())) {
            return true;
          }
        }

        return false;
      });
    }
  }

  /**
   * Returns the proper comparator based on the specified column name
   * @param {string} columnName - name of the column
   */
  getSorter(columnName: string): ClrDatagridComparatorInterface<T> {
    switch (columnName) {
      case 'id':
        return this.idComp;
      case 'symbol':
        return this.symbolComp;
      case 'name':
        return this.nameComp;
      case 'type':
        return this.typeComp;
      case 'chr':
        return this.chrComp;
      case 'descendants':
        return this.descComp;
      default:
        return null;
    }
  }

  /**
   * Sets the dragging indicator to true, sets the dragging mode (whether the
   * drag action will be selecting or deselecting all included features in drag)
   * and (de)select the starting row
   * @param {Feature} row - the feature row where the drag event starts
   */
  dragStart(row: Feature): void {
    this.dragging = true;
    // set drag mode to the OPPOSITE of the state the starting row is in
    this.dragMode = row.selected ? 'deselect' : 'select';
    this.dragOver(row);
  }

  /**
   * If the mouse event occurs during a drag event, select or deselect the
   * row depending on what the drag mode is
   * @param {Feature} row - the feature row that is being hovered over
   */
  dragOver(row: Feature): void {
    if (this.dragging) {
      if (this.dragMode === 'select') {
        row.select();
        if (!this.selections.filter(s => s.is(row.symbol)).length) {
          this.selections.push(row);
        }
      } else {
        row.deselect();
        this.removeSelection(row.symbol);
      }
    }
  }

  /**
   * End the drag and emit an update to parent
   */
  dragEnd(): void {
    this.dragging = false;
    this.dragMode = null;
  }

  /**
   * Removes the feature matching specified symbol and emit an update to parent
   * @param {string} symbol - the symbol of the feature to remove
   */
  removeSelection(symbol: string): void {
    this.selections = this.selections.filter(s => !s.is(symbol));

    // Ignore the TS property inspection here since selections are only possible
    // on tables where this.rows contain features, which all have symbols
    /* eslint-disable @typescript-eslint/ban-ts-ignore */
    // @ts-ignore
    this.rows.filter(r => r.symbol === symbol).forEach(r => r.deselect());
  }

  /**
   * Returns the specified value of the specified feature if the column isn't a
   * chromosomal position and a formatted value if it IS a chromosomal position
   * @param {Feature} row - the feature to get the value for
   * @param {string} col - the key to use to look up the value in the feature
   */
  getCell(row: T, col: string): string {
    if (row instanceof Feature) {
      return col === 'start' || col === 'end' ? format(',')(row[col]) : row[col];
    }
    return row[col];
  }

  /**
   * Returns the label for the paginator for the table based on how many
   * results are being displayed
   * @param {ClrDatagridPagination} pagination - the paginator data structure
   */
  getPaginatorLabel(pagination: ClrDatagridPagination): string {
    return this.filteredRows && this.filteredRows.length > pagination.pageSize
      ? `${pagination.firstItem + 1} - ${pagination.lastItem + 1}
       of ${pagination.totalItems}`
      : this.getSinglePagePaginatorLabel();
  }

  /**
   * Returns a customized results description for a set of results that don't
   * need a proper paginator (10 or fewer)
   */
  private getSinglePagePaginatorLabel(): string {
    const numRows = this.filteredRows.length;
    return numRows > 0 ? `1 - ${numRows} of ${numRows}` : '0 of 0';
  }

  /**
   * Returns the result (of the appropriate sorting class) of the two objects
   * (a and b) as long as the specified sortBy key exists on both objects
   * @param {OntologyTerm|Feature} a - the reference object
   * @param {OntologyTerm|Feature} b - the comparison object
   * @param {string} sortBy - the key to use for comparing the objects
   */
  private compare(a: T, b: T, sortBy: string): number {
    if (typeof a[sortBy] !== 'undefined' && typeof b[sortBy] !== 'undefined') {
      const comp = this.getSorter(sortBy);
      if (comp) {
        return comp.compare(a, b);
      }
    }

    return 0;
  }
}
