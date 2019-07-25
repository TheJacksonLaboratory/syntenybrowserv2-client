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
  highlighted: string[];

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

  /**
   * Returns the text that should appear in the search input
   */
  getSearchPlaceholder(): string {
    let term = this.ontologySearch.currentTerm;
    return this.searchType === 'symbol' ? 'Filter features by symbol, ID or type' :
      (term ? 'Filter features assoc w/ ' + term.id : 'Filter terms by name or ID');
  }

  /**
   * Returns the text that should appear as the label to the search input
   */
  getSearchLabel(): string {
    return this.searchType === 'symbol' || this.ontologySearch.currentTerm ?
      'search features': 'search terms ';
  }

  /**
   * Set the current search term to be that of either an ontology term if
   * associations are not being shown or associations of an ontology term if
   * they are (depends on which ontology table is currently visible)
   */
  setSearch(): void {
    let os = this.ontologySearch;
    this.search = os.currentTerm ? os.associationsSearch : os.termsSearch;
  }

  /**
   * Initiates a load of the ontology search term for current reference species
   * and specified ontology
   * @param {string} ontology - the ontology to load terms for
   */
  loadOntologyTerms(ontology: string = this.ontology): void {
    this.ontologySearch.loadTerms(this.refSpecies, ontology);
  }

  /**
   * Join the selections from the feature search and ontology search and make a
   * unique list from them and emits
   */
  updateSelections(): void {
    let selsFromFeatureSearch = this.featureSearch.features.selections;
    let selsFromOntologySearch = this.ontologySearch.associations.selections;
    let allSelections = selsFromFeatureSearch.concat(...selsFromOntologySearch);

    // get rid of duplicates
    this.selections = Array.from(new Set(allSelections));
    this.update.emit();
  }

  /**
   * Remove the associated selected feature that matches the specified symbol
   * @param {string} symbol - the symbol of the feature to remove from the
   *                          selection list
   */
  removeSelection(symbol: string): void {
    // if the feature with specified symbol isn't in one of the selection lists,
    // nothing will happen
    this.featureSearch.removeFeature(symbol);
    this.ontologySearch.removeAssociation(symbol);

    // update the list
    this.updateSelections();
  }

  /**
   * Returns true if the specified feature ID exists in the current highlighted
   * feature array
   * @param {string} featureID - the id of the feature (gene or QTL)
   */
  isHighlighted(featureID: string): boolean {
    return this.highlighted && this.highlighted.indexOf(featureID) > -1;
  }
}
