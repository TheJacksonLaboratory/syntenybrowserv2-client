import {ChangeDetectorRef, Component, EventEmitter, Output} from '@angular/core';
import {Species} from '../classes/species';
import {Metadata, SearchType} from '../classes/interfaces';
import {ApiService} from '../services/api.service';
import {ClrDatagridComparatorInterface} from '@clr/angular';

@Component({
  selector: 'app-feature-selection',
  templateUrl: './feature-selection.component.html',
  styleUrls: ['./feature-selection.component.scss']
})
export class FeatureSelectionComponent {
  refSpecies: Species;
  search: string = '';
  searchType: string;
  searchPlaceholder: string;
  rows: Array<Metadata> = [];
  filteredRows: Array<Metadata> = [];
  selections: Array<Metadata> = [];
  displayColumns: Array<string>;

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

    // set the search type to the first search type for the species by default
    this.searchType = this.refSpecies.searchTypes[0].name;

    // set the search term placeholder and table columns based on the search type
    this.setTypeDependentElements();
  }

  /**
   * Calls the API for features and updates the table with the results
   */
  searchForFeatures(): void {
    // if there's a search term, get features based on the current search type
    if(this.search !== '') {
      let sym = this.getSearchType().search_type === 'GeneName' ?
                'gene_symbol' : 'qtl_symbol';

      this.filteredRows = this.rows.filter(row => {
                                      return row[sym].toLowerCase()
                                              .includes(this.search.toLowerCase());
                                    })
    // if the search term has been cleared, show all features
    } else {
      this.filteredRows = this.rows;
    }
  }

  /**
   * Updates the search term placeholder and table columns based on the most
   * recent search type selected
   */
  setTypeDependentElements(): void {
    this.searchPlaceholder = this.getSearchType().search_example;
    this.displayColumns = this.getColumns();

    if(this.getSearchType().search_type === 'GeneName') {
      this.http.getAllGenes(this.refSpecies.getID())
        .subscribe(genes => {
          this.rows = genes;
          this.filteredRows = genes;
        });
    } else if(this.getSearchType().search_type === 'QTLName') {
      this.http.getAllQTLs(this.refSpecies.getID())
        .subscribe(qtls => {
          this.rows = qtls;
          this.filteredRows = qtls;
        });
    } else {
      // TODO: SEARCH FOR GENES BY ONTOLOGY => DESIGN A NEW QUERY SYSTEM
      // this.http.getOntGeneMatches(this.refSpecies.getID(), this.getSearchType().name, this.search)
      //          .subscribe(features => this.rows = features);
    }
    this.search = '';
  }

  /**
   * Emits to indicate that there has been an update in the selections to display
   */
  updateSelections(newRow: any): void {
    if(this.selections.map(sel => sel.gene_symbol ? sel.gene_symbol : sel.qtl_symbol)
                      .indexOf(newRow.gene_symbol ? newRow.gene_symbol : newRow.qtl_symbol) < 0) {
      this.selections.push(newRow);
    }

    this.update.emit();
  }

  removeSelection(feature: Metadata): void {
    let fSymbol = feature.gene_symbol ? feature.gene_symbol : feature.qtl_symbol;
    this.selections = this.selections.filter(sel => {
      let selSymbol  = sel.gene_symbol ? sel.gene_symbol : sel.qtl_symbol;
      return selSymbol !== fSymbol
    });

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
  getComparator(colName: string): ClrDatagridComparatorInterface<any> {
    if(colName.includes('id')) {
      return this.idComp;
    } else if(colName.includes('symbol')) {
      return this.symbolComp;
    } else if(colName.includes('type')) {
      return this.typeComp;
    } else if(colName.includes('chr')) {
      return this.chrComp;
    } else {
      return null;
    }
  }


  // Private Methods

  /**
   * Returns a set list of column names based on the search type
   * TODO: I MIGHT HAVE TO FIDGET WITH THE LIFECYCLE HOOKS BUT IF WE USE ALL
   * TODO: KEYS AS COLUMNS, WE SHOULD BE ABLE TO SET THE COLUMNS AS THE LIST OF
   * TODO: KEYS RATHER THAN HARD CODING THEM HERE
   */
  private getColumns(): Array<string> {
    if(this.getSearchType().search_type === 'GeneName') {
      return ['gene_id', 'gene_symbol', 'gene_type', 'chr',
              'start', 'end'];
    } else if(this.getSearchType().search_type === 'QTLName') {
      return ['qtl_id', 'qtl_symbol', 'chr', 'start', 'end'];
    } else {
      return ['term_id', 'term_name', 'gene_id', 'gene_symbol',
              'gene_type', 'chr', 'start', 'end'];
    }
  }

  /**
   * Returns the current search type object based on the current selected
   * search type value (string)
   */
  private getSearchType(): SearchType {
    return this.refSpecies.searchTypes.filter(t => t.name === this.searchType)[0];
  }

  /**
   * Customizes the results description for a set of results that don't need a
   * proper paginator (10 or fewer)
   */
  private getSinglePagePaginatorLabel(): string {
    return this.rows.length > 0 ?
      `1 - ${this.rows.length} of ${this.rows.length}` : '0 of 0';
  }

}


// Comparator Classes

/**
 * Comparator for sorting features in the feature search table by ID
 */
export class IDComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: any, b: any) {
    if(a.gene_id && b.gene_id) {
      let aID = Number(a.gene_id.replace('MGI:', ''));
      let bID = Number(b.gene_id.replace('MGI:', ''));
      return aID - bID;
    } else {
      return Number(a.qtl_id) - Number(b.qtl_id);
    }
  }
}

/**
 * Comparator for sorting features in the feature search table by symbol
 */
export class SymbolComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: any, b: any) {
    if(a.gene_id && b.gene_id) {
      return a.gene_symbol.localeCompare(b.gene_symbol);
    } else {
      return a.qtl_symbol.localeCompare(b.qtl_symbol);
    }
  }
}

/**
 * Comparator for sorting genes in the feature search table by type
 */
export class TypeComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: any, b: any) {
    return a.gene_type.localeCompare(b.gene_type); }
}

/**
 * Comparator for sorting features in the feature search table by chromosome
 */
export class ChrComparator implements ClrDatagridComparatorInterface<any> {
  compare(a: any, b: any) {
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

