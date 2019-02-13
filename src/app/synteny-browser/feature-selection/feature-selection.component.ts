import { ApiService } from '../services/api.service';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { ClrDatagridComparatorInterface } from '@clr/angular';
import { Metadata, SearchType } from '../classes/interfaces';
import { Species } from '../classes/species';
import { Feature } from '../classes/feature';
import { format } from 'd3';

@Component({
  selector: 'app-feature-selection',
  templateUrl: './feature-selection.component.html',
  styleUrls: ['./feature-selection.component.scss']
})
export class FeatureSelectionComponent {
  refSpecies: Species;
  search: string = '';
  searchType: string = 'symbol';
  searchPlaceholder: string = 'Search features by symbol...';
  loading: boolean = false;
  rows: Array<Feature> = [];
  filteredRows: Array<Feature> = [];
  selections: Array<Feature> = [];
  columns: Array<string> = ['id', 'symbol', 'chr', 'start', 'end', 'type'];
  dragging: boolean = false;
  dragMode: string = null;

  // sorting classes
  idComp = new IDComparator();
  symbolComp = new SymbolComparator();
  typeComp = new TypeComparator();
  chrComp = new ChrComparator();

  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService) { }


  // Operational Methods

  /**
   * Initializes the component based on the specified reference species
   * @param {Species} referenceSpecies - the current reference species
   */
  load(referenceSpecies: Species): void {
    this.refSpecies = referenceSpecies;

    // set the search term placeholder and table columns based on the search type
    this.setTypeDependentElements();
  }

  /**
   * Calls the API for features and updates the table with the results
   */
  searchForFeatures(): void {
    this.filteredRows = this.search !== '' ?
                        this.rows.filter(f => f.matchesSearch(this.search)) :
                        this.rows;
  }

  /**
   * Updates the search term placeholder and table columns based on the most
   * recent search type selected
   */
  setTypeDependentElements(): void {
    this.loading = true;

    if(this.searchType === 'symbol') {
      this.http.getAllGenes(this.refSpecies.getID())
               .subscribe(genes => {
                 this.rows = genes;

                 if(this.refSpecies.hasQTLs) {
                   this.http.getAllQTLs(this.refSpecies.getID())
                            .subscribe(qtls => {
                              this.rows.push(...qtls);
                              this.rows.sort((a, b) => this.compare(a, b));

                              this.filteredRows = this.rows;
                              this.loading = false;
                            });
                 } else {
                   this.rows.sort((a, b) => this.compare(a, b));
                   
                   this.filteredRows = this.rows;
                   this.loading = false;
                 }
               });
    } else {
      // TODO: SEARCH FOR GENES BY ONTOLOGY => DESIGN A NEW QUERY SYSTEM
    }
    this.search = '';
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
    if(this.dragging) {
      if(this.dragMode === 'select') {
        row.select();
        if(this.selections.filter(s => s.is(row.symbol)).length === 0) {
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
    this.update.emit();
  }

  /**
   * Removes the feature matching specified symbol and emit an update to parent
   * @param {string} symbol - the symbol of the feature to remove
   */
  removeSelection(symbol: string): void {
    this.selections = this.selections.filter(s => !s.is(symbol));
    this.rows.filter(r => r.symbol === symbol)[0].deselect();

    this.update.emit();
  }


  // Getter Methods

  /**
   * Returns the label for the paginator for the table based on how many
   * results are being displayed
   * @param {any} pagination - the paginator data structure
   */
  getPaginatorLabel(pagination: any): string {
    return (this.rows && this.rows.length > 10) ?
      `${pagination.firstItem + 1} - ${pagination.lastItem + 1} 
       of ${pagination.totalItems}` : this.getSinglePagePaginatorLabel();
  }

  /**
   * Returns the proper comparator based on the specified column name
   * @param {string} colName - name of the column
   */
  getSorter(colName: string): ClrDatagridComparatorInterface<any> {
    if(colName === 'id') {
      return this.idComp;
    } else if(colName === 'symbol') {
      return this.symbolComp;
    } else if(colName === 'type') {
      return this.typeComp;
    } else if(colName === 'chr') {
      return this.chrComp;
    } else {
      return null;
    }
  }

  /**
   * Returns the specified value of the specified feature if the column isn't a
   * chromosomal position and a formatted value if it IS a chromosomal position
   * @param {Feature} row - the feature to get the value for
   * @param {string} col - the key to use to look up the value in the feature
   */
  getCell(row: Feature, col: any): string {
    return (col === 'start' || col === 'end') ? format(',')(row[col]) : row[col];
  }


  // Private Methods

  /**
   * Returns a customized results description for a set of results that don't
   * need a proper paginator (10 or fewer)
   */
  private getSinglePagePaginatorLabel(): string {
    let numRows = this.filteredRows.length;
    return numRows > 0 ? `1 - ${numRows} of ${numRows}` : '0 of 0';
  }

  /**
   * Returns a compare value (-1, 0, 1) when comparing two features for sorting
   * @param {Feature} a - the base (reference) feature
   * @param {Feature} b - the comparison feature
   */
  private compare(a: Feature, b: Feature): number {
    return a.symbol.localeCompare(b.symbol);
  }
}


// Comparator Classes

/**
 * Comparator for sorting features in the feature search table by ID
 */
export class IDComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: Feature, b: Feature) {
    return Number(a.id.replace('MGI:', '')) - Number(b.id.replace('MGI:', ''));
  }
}

/**
 * Comparator for sorting features in the feature search table by symbol
 */
export class SymbolComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: Feature, b: Feature) { return a.symbol.localeCompare(b.symbol); }
}

/**
 * Comparator for sorting genes in the feature search table by type
 */
export class TypeComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: Feature, b: Feature) { return a.type.localeCompare(b.type); }
}

/**
 * Comparator for sorting features in the feature search table by chromosome
 */
export class ChrComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: Feature, b: Feature) {
    // if a.chr is y, b comes first
    if(a.chr.toLowerCase() === 'y') return 1;
    // if b.chr is y, a comes first
    else if(b.chr.toLowerCase() === 'y') return -1;
    // if neither a.chr or b.chr are y and a.chr is x, then b.chr must
    // be a number and comes first
    else if(a.chr.toLowerCase() === 'x') return 1;
    // if neither a.chr or b.chr are y and b.chr is x, then a.chr must
    // be a number and comes first
    else if(b.chr.toLowerCase() === 'x') return -1;
    // if neither a.chr or b.chr are x or y, then compare numerical chr values
    else return Number(a.chr) - Number(b.chr);
  }
}

