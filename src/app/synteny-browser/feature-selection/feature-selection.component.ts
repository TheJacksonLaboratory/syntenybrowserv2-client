import { ApiService } from '../services/api.service';
import { ChangeDetectorRef, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ClrDatagridComparatorInterface, ClrDatagridPagination } from '@clr/angular';
import { Metadata, OntologyTerm, SearchType } from '../classes/interfaces';
import { Species } from '../classes/species';
import { Feature } from '../classes/feature';
import { format } from 'd3';
import { ChrComparator, DescendantsComparator, IDComparator, NameComparator,
         SymbolComparator, TypeComparator } from '../classes/comparators';
import { OntologySearchComponent } from './ontology-search/ontology-search.component';
import { FeatureSearchComponent } from './feature-search/feature-search.component';

@Component({
  selector: 'app-feature-selection',
  templateUrl: './feature-selection.component.html',
  styleUrls: ['./feature-selection.component.scss']
})
export class FeatureSelectionComponent {
  @ViewChild(OntologySearchComponent, {static: true}) ontologySearch: OntologySearchComponent;
  @ViewChild(FeatureSearchComponent, {static: true}) featureSearch: FeatureSearchComponent;

  refSpecies: Species;

  searchType: string = 'symbol';
  ontology: string;
  search: string = '';

  selections: Feature[] = [];

  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor() { }


  // Operational Methods

  /**
   * Initializes the component based on the specified reference species
   * @param {Species} referenceSpecies - the current reference species
   */
  load(referenceSpecies: Species): void {
    this.refSpecies = referenceSpecies;
    this.ontology = this.refSpecies.onts[0].value;

    // empty out selection lists
    this.selections = [];
    this.featureSearch.features.selections = [];
    this.ontologySearch.associations.selections = [];

    // set the search term placeholder and table columns based on the search type
    this.setTypeDependentElements();
  }

  /**
   * Filters rows and only shows matches to search value
   */
  searchForFeatures(): void {
    if(this.searchType === 'symbol') {
      this.featureSearch.featuresSearch = this.search;
      this.featureSearch.features.searchFor(this.search);
    } else {
      if(this.ontologySearch.currentTerm) {
        this.ontologySearch.associationsSearch = this.search;
        this.ontologySearch.associations.searchFor(this.search);
      } else {
        this.ontologySearch.termsSearch = this.search;
        this.ontologySearch.terms.searchFor(this.search);
      }
    }
  }

  /**
   * Updates the search term placeholder and table columns based on the most
   * recent search type selected
   */
  setTypeDependentElements(): void {
    this.search = '';

    this.searchType === 'symbol' ?
      this.featureSearch.loadFeatures(this.refSpecies) : this.loadOntologyTerms();
  }

  getSearchPlaceholder(): string {
    let term = this.ontologySearch.currentTerm;
    return this.searchType === 'symbol' ? 'Filter features by symbol, ID or type' :
      (term ? 'Filter features assoc w/ ' + term.id : 'Filter terms by name or ID');
  }

  getSearchLabel(): string {
    return this.searchType === 'symbol' || this.ontologySearch.currentTerm ?
      'search features': 'search terms ';
  }

  setSearch(): void {
    let os = this.ontologySearch;
    this.search = os.currentTerm ? os.associationsSearch : os.termsSearch;
  }

  loadOntologyTerms(ontology: string = this.ontology): void {
    this.ontologySearch.loadTerms(this.refSpecies, ontology);
  }

  updateSelections(): void {
    let selsFromFeatureSearch = this.featureSearch.features.selections;
    let selsFromOntologySearch = this.ontologySearch.associations.selections;
    let allSelections = selsFromFeatureSearch.concat(...selsFromOntologySearch);

    this.selections = Array.from(new Set(allSelections));
    this.update.emit();
  }

  removeSelection(symbol: string): void {
    // if the feature with specified symbol isn't in one of the selection lists,
    // nothing will happen
    this.featureSearch.removeFeature(symbol);
    this.ontologySearch.removeAssociation(symbol);

    this.updateSelections();
  }
}
