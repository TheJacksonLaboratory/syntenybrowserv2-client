import {ChangeDetectorRef, Component, EventEmitter, Output} from '@angular/core';
import {Species} from '../classes/species';
import {Metadata, SearchType} from '../classes/interfaces';
import {ApiService} from '../services/api.service';

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
  masterSelections: Array<Metadata> = [];
  selections: Array<Metadata> = [];
  displayColumns: Array<string>;

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
      if(this.getSearchType().search_type === 'GeneName') {
        this.http.getGeneMatches(this.refSpecies.getID(), this.search)
                 .subscribe(features => {
                   this.rows = features;
                 });
      } else if(this.getSearchType().search_type === 'QTLName') {
        this.http.getQTLMatches(this.refSpecies.getID(), this.search)
                 .subscribe(features => {
                   this.rows = features
                 });
      } else {
        // TODO: SEARCH FOR GENES BY ONTOLOGY => DESIGN A NEW QUERY SYSTEM
        // this.http.getOntGeneMatches(this.refSpecies.getID(), this.getSearchType().name, this.search)
        //          .subscribe(features => this.rows = features);
      }
    // if the search term has been cleared, empty the table
    } else {
      this.rows = [];
    }
  }

  /**
   * Updates the search term placeholder and table columns based on the most
   * recent search type selected
   */
  setTypeDependentElements(): void {
    this.searchPlaceholder = this.getSearchType().search_example;
    this.displayColumns = this.getColumns();
  }

  /**
   * Emits to indicate that there has been an update in the selections to display
   */
  updateSelections(): void {
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
              'start', 'end', 'strand'];
    } else if(this.getSearchType().search_type === 'QTLName') {
      return ['qtl_id', 'qtl_symbol', 'chr', 'start', 'end'];
    } else {
      return ['term_id', 'term_name', 'gene_id', 'gene_symbol',
              'gene_type', 'chr', 'start', 'end', 'strand'];
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
