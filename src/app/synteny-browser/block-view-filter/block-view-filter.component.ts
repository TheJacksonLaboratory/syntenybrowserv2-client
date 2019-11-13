import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Species } from '../classes/species';
import { NavigationObject } from '../classes/interfaces';
import { Gene } from '../classes/gene';
import { ClrDatagridPagination, ClrLoadingState } from '@clr/angular';
import { Filter } from '../classes/filter';
import { ApiService } from '../services/api.service';
import { DownloadService } from '../services/download.service';
import { DataStorageService } from '../services/data-storage.service';
import { FilterCondition } from '../classes/filter-condition';

@Component({
  selector: 'block-view-filter',
  templateUrl: './block-view-filter.component.html',
  styleUrls: ['./block-view-filter.component.scss']
})
export class BlockViewFilterComponent implements OnInit {
  @Input() refSpecies: Species;
  @Input() compSpecies: Species;
  @Input() filters: Filter[];
  @Input() refGenes: Gene[];
  @Input() compGenes: Gene[];

  navigation: NavigationObject[];
  activePage: string = 'edit';

  currentFilter: Filter;
  filterErrorState: string = null;
  attributes: string[];
  filterMode: string = 'add';
  editingFilter: Filter = null;

  allGenes: Gene[];
  filteredGenes: Gene[];

  @Output() userClose: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService,
              public data: DataStorageService,
              private download: DownloadService) {
    this.navigation = [ { name: 'edit filters', value: 'edit' },
                        { name: 'preview filters', value: 'preview' },
                        { name: 'filtering guide', value: 'guide' } ];
  }

  ngOnInit(): void {
    this.allGenes = this.refGenes.concat(... this.compGenes);
    this.filteredGenes = [];

    this.createNewEditableFilter();
  }


  // Operational Methods

  /**
   * Creates a new default filter and sets it as the current filter
   */
  createNewEditableFilter(advancedMode: boolean = true): void {
    this.filters.push(this.getNewFilter(advancedMode));
    this.currentFilter = this.getCurrentFilter();
  }

  /**
   * Marks the specified filter as the current filter (editable) if the user is
   * in the edit page
   * @param {Filter} filter - the filter to mark as the current one to edit
   */
  editFilter(filter: Filter): void {
    if(this.activePage === 'edit') {
      this.filterMode = 'edit';
      filter.editing = true;

      this.currentFilter = this.getCurrentFilter();
      this.filters = this.getCreatedFilters();

      this.reassignFilterIDs();
    }
  }

  /**
   * Marks the current filter as finished (aka "created") so that it is added to
   * the filter labels as long as there aren't any empty fields and creates a
   * new blank filter to edit
   */
  finishFilter(): void {
    // clear any current messages
    this.filterErrorState = '';

    if(!this.currentFilter.allConditionsAreComplete()) {
      this.filterErrorState = 'Please fill out all fields';
      return;
    }

    // if it's a "simple" filter, make sure that it only has a single condition
    if(!this.currentFilter.advancedFilter) {
      this.currentFilter.conditions = [this.currentFilter.conditions[0]];
      this.currentFilter.setLabel();
    }

    this.currentFilter.conditions.forEach(c => c.editing = false);

    this.currentFilter.editing = false;
    this.currentFilter.created = true;

    // TODO: this is vastly inefficient and shouldn't be run for every filter
    //       every time a new one is finished
    this.filteredGenes = [];
    this.applyFilters();

    this.filterMode = 'add';

    // create a new filter using the current filter's advanced/simple setting
    this.createNewEditableFilter(this.currentFilter.advancedFilter);
  }

  /**
   * Applies the current selections in the preview checklist by making the
   * current filter list reflecting the selected filters
   */
  applyFilterSelections(): void {
    this.filters = this.filters.filter(f => f.selected);
  }

  /**
   * Removes the specified filter from the list of filters
   * @param {Filter} filter - the title of the filter to remove
   */
  removeFilter(filter: Filter): void {
    this.filters = this.filters.filter(f => f.id !== filter.id);

    // update filter ids so they reflect their current index in the filter list
    this.reassignFilterIDs();

    // TODO: this is vastly inefficient and shouldn't be run for every filter
    //       every time a new one is finished
    this.filteredGenes = [];
    this.applyFilters();
  }

  /**
   * Removes the specified condition from the current filter
   * @param {FilterCondition} cond - the condition to remove
   */
  removeCondition(cond: FilterCondition): void {
    this.currentFilter.removeCondition(cond);
  }

  /**
   * Updates the specified filter condition selected flag based on the event
   * value and apply the selected filters to the feature table
   * @param {FilterCondition} changedFilter - filter that's being (de)selected
   * @param {number} event - event code; 0 (deselected) or 1 (selected)
   */
  runFilters(changedFilter: Filter, event: number): void {
    changedFilter.selected = event === 1;
    this.filteredGenes = this.applyFilters();
  }

  /**
   * Formats all of the selected filters' metadata as well as all of the
   * resulting genes in the table into a TSV-like file
   */
  downloadTable(): void {
    let ref = this.refSpecies.commonName;
    let comp = this.compSpecies.commonName;
    let rows = this.filteredGenes.map(g => g.getFilterMetadata(ref, comp));

    let lines = '[FILTER DATA]\nfilter type\tspecies\tcondition(s)\n' +
                this.getCreatedFilters().filter(f => f.selected)
                                        .map(f => f.getTSVRowForFilter())
                                        .join('\n') +
                '\n\n[RESULTS DATA]\n' +
                Object.keys(rows[0]).join('\t') + '\n' +
                rows.map(r => Object.values(r).join('\t')).join('\n');

    this.download.downloadText(lines, 'filter-results.txt');
  }

  /**
   * Sets the current filter's variables to filter by the specified attribute
   * @param {string} attribute - the attribute to filter features by
   */
  simpleFilterByAttribute(attribute: string): void {
    this.currentFilter.conditions[0].filterBy = attribute;
    this.currentFilter.conditions[0].value = attribute;
  }

  /**
   * Sets the current filter's variables to filter by a specified ontology
   * @param {string} ontology - the ontology to filter features by
   */
  simpleFilterByOntology(ontology: string): void {
    this.currentFilter.conditions[0].filterBy = 'ont-' + ontology;
    this.currentFilter.conditions[0].qualifier = 'equal';
    this.currentFilter.conditions[0].value = null;
    this.currentFilter.simpleUserInputNeeded = true;
    this.currentFilter.setSimpleTitle();
  }

  /**
   * Sets the current filter's type to be the specified feature type and
   * finishes the filter
   * @param {string} type - the feature type to filter features by
   */
  simpleFilterByType(type: string): void {
    this.currentFilter.conditions[0].value = type;
    this.finishFilter();
  }

  /**
   * Sets the current filter's qualifier variables to consider user input
   * @param {string} qualifier - whether the user wants exact matches or a more
   *                             loose matching model
   */
  simpleFilterQualifier(qualifier: string): void {
    this.currentFilter.conditions[0].qualifier = qualifier;
    this.currentFilter.simpleUserInputNeeded = true;
    this.currentFilter.setSimpleTitle();
  }

  /**
   * Emits a message if the term that's been selected is too broad to search
   */
  checkTermChildren(cond: FilterCondition = this.currentFilter.conditions[0]): void {
    let ontTerms = this.data.ontologyTerms[cond.getOntology()];
    if(cond && cond.value) {
      let termIDs = ontTerms.map(t => t.id);
      let term = ontTerms[termIDs.indexOf(cond.value)];

      if(term.count && term.count > 500) {
        this.filterErrorState = 'Term too broad';
      } else {
        this.filterErrorState = '';
        this.currentFilter.setLabel();
      }
    }
  }


  // Getter Methods

  /**
   * Returns the list of types available to filter by based on what the selected
   * species is for the current filter
   * @param {Filter} filter - the filter to get feature types for
   */
  getFeatureTypes(filter: Filter): string[] {
    let genes = this.getGenesForSpecies(filter);
    let types = Array.from(new Set(genes.map(g => g.type).filter(t => t))).sort();

    // if any of the conditions have type selections that aren't valid
    // anymore, revert them to null so that user must choose a new type
    this.currentFilter.conditions.forEach(c => {
      if(c.hasInvalidType(types)) {
        c.value = null;
      }
    });

    return types;
  }

  /**
   * Returns the list of genes associated with the species identified by the
   * specified filter
   * @param {Filter} filter - the filter to get genes for
   */
  getGenesForSpecies(filter: Filter): Gene[] {
    if(filter.isRefFilter() && filter.isCompFilter()) {
      return this.allGenes
    } else if(filter.isRefFilter()) {
      return this.refGenes;
    } else {
      return this.compGenes;
    }
  }

  /**
   * Returns a style configuration object for a navigation item in the sidebar
   * to determine font weight for the specified page (makes active page bold)
   * @param {string} pageTitle - the title of the page
   */
  getNavItemStyle(pageTitle: string): object {
    return { 'font-weight': this.activePage === pageTitle ? 'bold' : 'normal' };
  }

  /**
   * Returns the label for the paginator for the table based on how many
   * results are being displayed
   * @param {ClrDatagridPagination} pag - the datagrid paginator
   */
  getPaginatorLabel(pag: ClrDatagridPagination): string {
    return `${pag.firstItem + 1} - ${pag.lastItem + 1} of ${pag.totalItems}`;
  }

  /**
   * Returns the current filter being edited
   */
  getCurrentFilter(): Filter { return this.filters.filter(f => f.editing)[0]; }

  /**
   * Returns the list of filters that have been completed/created
   */
  getCreatedFilters(): Filter[] { return this.filters.filter(f => f.created); }


  // Condition Checks

  /**
   * Returns true/false if all of the filters are currently selected
   */
  allFiltersSelected(): boolean {
    return this.getCreatedFilters().length ===
      this.getCreatedFilters().filter(f => f.selected).length;
  }


  // Private Methods

  /**
   * Creates a new filter and returns it
   */
  private getNewFilter(advancedMode: boolean): Filter {
    return new Filter(this.refSpecies,
      this.compSpecies,
      this.filters.length,
      advancedMode);
  }

  /**
   * Sets each of the current filter's ID to its index in the list
   */
  private reassignFilterIDs(): void { this.filters.forEach((f, i) => f.id = i); }

  /**
   * Returns an array of genes that are affected by the current selected filters
   * for the table
   */
  private applyFilters(): Gene[] {
    this.refGenes.forEach(g => g.resetFilterStatus());
    this.compGenes.forEach(g => g.resetFilterStatus());

    if(this.anyFiltersSelected()) {
      let filters = this.getCreatedFilters();
      let hidingFilters = filters.filter(f => f.hides() && f.selected);
      let highlightFilters = filters.filter(f => !f.hides() && f.selected);

      // order matters here because if a gene satisfies an 'exclude' criteria AND
      // an 'include' criteria, the include should take precendence over the
      // exclude; in other words, if a gene satisfies AT LEAST ONE condition, it
      // should be filtered
      if(hidingFilters.length > 0) {
        this.hideGenes(filters.filter(f => f.hides() && f.selected));
      }

      if(highlightFilters.length > 0) {
        this.filterGenes(filters.filter(f => !f.hides() && f.selected));
      }

      return this.refGenes.concat(...this.compGenes)
                          .filter(g => g.filtered || g.hidden);
    }

    return [];
  }

  /**
   * Returns true/false if at least one filter is selected in the checklist
   */
  private anyFiltersSelected(): boolean {
    return this.getCreatedFilters().filter(f => f.selected).length > 0;
  }

  /**
   * Returns a list of genes from the specified list of genesthat match at least
   * one of the specified filters
   * @param {Gene[]} genes - the list of genes to search for matches
   * @param {Filter[]} filters - the list of filters to check for matches
   * @param {Species} species - the species for the filter (if the filter uses
   *                            both, it'll use this method twice, so pass a
   *                            species each time to reduce the computational
   *                            weight)
   */
  private getMatches(genes: Gene[], filters: Filter[], species: Species) {
    let ontologyFilters = filters.filter(f => f.isFilteringByOntologyTerm());
    let attributeFilters = filters.filter(f => !f.isFilteringByOntologyTerm());

    // check ontology filters first since they will take the longest
    if(ontologyFilters.length > 0) {
      ontologyFilters.forEach(f => {
        f.conditions.forEach(c => {
          this.http.getAssociationsForTerm(species.getID(), c.value)
            .subscribe(assoc => {
              let assocIDs = assoc.map(a => a.id);
              let associations = genes.filter(g => assocIDs.indexOf(g.id) >= 0);

              associations.forEach(a => !f.hides() ? a.filter() : a.hide());
              this.filteredGenes.push(...associations);

            });
        });
      });
    }

    // check attribute filters
    if(attributeFilters.length > 0) {
      let matches = genes.filter(g => {
        for(let i = 0; i < attributeFilters.length; i++) {
          if(attributeFilters[i].matchesFilter(g)) {
            !attributeFilters[i].hides() ? g.filter() : g.hide();
            return true;
          }
        }

        return false;
      });

      this.filteredGenes.push(...matches);
    }
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified filters as 'hidden'
   * @param {Filter[]} filters - list of filters to check genes against
   */
  private hideGenes(filters: Filter[]): void {
    let refFilters = filters.filter(f => f.isRefFilter());
    let compFilters = filters.filter(f => f.isCompFilter());

    if(refFilters.length > 0) {
      this.getMatches(this.refGenes, refFilters, this.refSpecies);
    }

    if(compFilters.length > 0) {
      this.getMatches(this.compGenes, compFilters, this.compSpecies);
    }
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified filters as 'filtered'
   * @param {Filter[]} filters - list of conditions to check genes against
   */
  private filterGenes(filters: Filter[]): void {
    let refFilters = filters.filter(f => f.isRefFilter());
    let compFilters = filters.filter(f => f.isCompFilter());

    if(refFilters.length > 0) {
      this.getMatches(this.refGenes, refFilters, this.refSpecies);
    }

    if(compFilters.length > 0) {
      this.getMatches(this.compGenes, compFilters, this.compSpecies);
    }
  }
}
