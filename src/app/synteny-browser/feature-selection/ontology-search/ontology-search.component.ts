import { Component, EventEmitter, Output } from '@angular/core';
import { ClrLoadingState } from '@clr/angular';
import { ApiService } from '../../services/api.service';
import { Species } from '../../classes/species';
import { OntologyTerm } from '../../classes/interfaces';
import { Feature } from '../../classes/feature';
import { TableData } from '../../classes/table-data';
import { DataStorageService } from '../../services/data-storage.service';

@Component({
  selector: 'ontology-search',
  templateUrl: './ontology-search.component.html',
  styleUrls: ['./ontology-search.component.scss'],
})
export class OntologySearchComponent {
  // currently selected reference species
  refSpecies: Species;

  // prefix for currently selected ontology
  ontology: string;

  // table data containing all of the terms to display in the terms datagrid
  terms: TableData<OntologyTerm>;

  // current search string that filters the terms datagrid
  termsSearch = '';

  // currently selected term to show associations for
  currentTerm: OntologyTerm;

  // table data containing all of the associations to display in the associations datagrid
  associations: TableData<Feature>;

  // current search string that filters the terms datagrid
  associationsSearch = '';

  // emits whenever association (de)selections are made
  @Output() update: EventEmitter<any> = new EventEmitter();

  // emits whenever user wants to see associations for a term or go back to see all terms
  @Output() switchView: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService, private data: DataStorageService) {
    this.terms = new TableData(['id', 'name'], ['id', 'name']);
    this.associations = new TableData(['termID', 'term', 'id', 'symbol'], ['term', 'id', 'symbol']);
  }

  /**
   * Sets the reference species and current ontology, and retrieves the terms
   * for the specified reference species and ontology and sets the table rows
   * with the results, sorted by ontology term ID
   * @param {Species} refSpecies - the current reference species
   * @param {string} ontology - the ontology ID prefix
   */
  loadTerms(refSpecies: Species, ontology: string): void {
    this.refSpecies = refSpecies;
    this.ontology = ontology;

    this.currentTerm = null;
    this.terms.loading = true;
    this.termsSearch = '';

    this.terms.clear();

    // as a precaution, if the ontology terms have already been loaded into the
    // data storage service, use them but if not, go get them; it would be better
    // to take an extra 1-3 seconds instead of erroring in the interface
    if (!this.data.ontologyTerms[ontology]) {
      this.http.getOntologyTerms(ontology).subscribe(terms => {
        this.terms.setRows(terms);
        this.terms.loading = false;
      });
    } else {
      this.terms.setRows(this.data.ontologyTerms[ontology]);
      this.terms.loading = false;
    }
  }

  /**
   * Returns true if either the terms grid or association grid is still
   * actively loading
   */
  isLoading(): boolean {
    return this.terms.loading || this.associations.loading;
  }

  /**
   * Clears the terms and associations grid
   */
  clear(): void {
    this.terms.clear();
    this.associations.clear();
  }

  /**
   * Switches the view away from the association table back to the term table
   */
  backToTerms(): void {
    this.currentTerm = null;
    this.switchView.emit();
  }

  /**
   * Retrieves the gene associations for the specified ontology term and switches
   * the view to the associations table if the user wants to see the associations
   * or automatically marks all associations as selected if the user wants all
   * associations
   * @param {OntologyTerm} term - the term selected
   * @param {boolean} showResults - whether the user wants to see the results
   */
  loadAssociationsForTerm(term: OntologyTerm, showResults = true): void {
    this.associations.clear();

    if (!showResults) {
      term.selecting = ClrLoadingState.LOADING;
    }
    this.currentTerm = showResults ? term : null;
    this.associations.loading = showResults;
    this.switchView.emit();

    const termToSearch = this.currentTerm ? this.currentTerm.id : term.id;

    this.http
      .getTermAssociations(this.refSpecies.getID(), encodeURIComponent(termToSearch))
      .subscribe(genes => {
        if (showResults) {
          this.associations.setRows(genes);
        } else {
          genes.forEach(g => g.select());
          this.associations.rows = genes;
          this.associations.selections = genes;
          term.selecting = ClrLoadingState.SUCCESS;
          this.update.emit();
        }
      });
  }

  /**
   * Ends the drag behavior and emits an update event to parent component
   */
  updateAssociationSelections(): void {
    this.associations.dragEnd();
    this.update.emit();
  }

  /**
   * Returns the text for the title tooltip describing what the view associations
   * button does and if it's disabled (and the reason)
   * @param {OntologyTerm} term - the term that the tooltip needs content for
   */
  getViewAssociationsTitle(term: OntologyTerm): string {
    return `View gene associations with this term${
      term.count >= 100 ? ' [disabled for being too broad]' : ''
    }`;
  }

  /**
   * Returns the text for the title tooltip describing what the 'select all
   * associations' button does and if it's disabled (and the reason)
   * @param {OntologyTerm} term - the term that the tooltip needs content for
   */
  getSelectAllAssociationsTitle(term: OntologyTerm): string {
    return `Select all gene associations with this term${
      term.count >= 500 ? ' [disabled for being too broad]' : ''
    }`;
  }

  /**
   * Removes the gene association with the specified symbol from the selections
   * @param {string} symbol - the symbol of the gene association to remove
   */
  removeAssociation(symbol: string): void {
    this.associations.removeSelection(symbol);
  }
}
