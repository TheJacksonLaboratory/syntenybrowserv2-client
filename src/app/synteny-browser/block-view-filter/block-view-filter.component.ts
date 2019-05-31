import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Species } from '../classes/species';
import { FilterCondition, NavigationObject } from '../classes/interfaces';
import { Gene } from '../classes/gene';
import { ClrDatagridPagination } from '@clr/angular';
import { Filter } from '../classes/filter';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-block-view-filter',
  templateUrl: './block-view-filter.component.html',
  styleUrls: ['./block-view-filter.component.scss']
})
export class BlockViewFilterComponent implements OnInit {
  @Input() refSpecies: Species;
  @Input() compSpecies: Species;
  @Input() filters: Array<Filter>;
  @Input() refGenes: Array<Gene>;
  @Input() compGenes: Array<Gene>;

  navigation: Array<NavigationObject>;
  activePage: string = 'edit';

  currentFilter: Filter;
  conditionSpecies: string = 'both';
  filterErrorState: string = null;
  filterTestResults: string = null;
  attributes: Array<string>;
  filterMode: string = 'add';
  editingFilter: Filter = null;

  allGenes: Array<Gene>;
  filteredGenes: Array<Gene>;

  @Output() userClose: EventEmitter<any> = new EventEmitter();

  constructor(private cdr: ChangeDetectorRef, private http: ApiService) {
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
  createNewEditableFilter(): void {
    this.filters.push(this.getNewFilter());
    this.currentFilter = this.getCurrentFilter();
  }

  /**
   * Marks the specified filter as the current filter (editable) if the user is
   * in the edit page
   * @param {Filter} filter - the filter to mark as the current one to edit
   */
  editFilter(filter: Filter): void {
    if(this.activePage === 'edit') {
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
    this.filterTestResults = '';

    if(this.currentFilter.allConditionsAreComplete()) {
      this.currentFilter.editing = false;
      this.currentFilter.created = true;

      this.createNewEditableFilter();
    } else {
      this.filterErrorState = 'Please fill out all fields';
    }
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
  }

  /**
   * Displays the number of features/genes the current filter's condition(s)
   * will affect in its current state
   */
  showCurrentFilterResults(): void {
    this.filterErrorState = '';
    this.filterTestResults = '';

    // give the conditions' type selects a chance to update to reflect species
    // in case they changed (if a condition contains a type selection that is no
    // longer available after changing species selection, we don't want to show
    // the results since the condition would be considered "incomplete"
    this.cdr.detectChanges();

    // only show number of affected genes if all fields are properly filled out
    if(this.currentFilter.allConditionsAreComplete()) {
      let genes = this.currentFilter.speciesKey === 'both' ?
        this.allGenes : (this.currentFilter.speciesKey === 'ref' ?
          this.refGenes : this.compGenes);
      let numGenes = this.getMatches(genes, [this.currentFilter]).length;

      this.filterTestResults = `${this.currentFilter.mode}s ${numGenes} 
                                feature${numGenes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Removes the specified condition from the current filter
   * @param {FilterCondition} cond - the condition to remove
   */
  removeCondition(cond: FilterCondition): void {
    this.currentFilter.removeCondition(cond);

    // show an updated results number after the removal
    this.showCurrentFilterResults();
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

    let blob = new Blob([lines], { type: 'data:text/plain;charset=utf-8,' });

    if(navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, 'filter-results.txt');
    } else {
      let link = document.createElement('a');

      if(link.download !== undefined) {
        let url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'filter-results.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }


  // Getter Methods

  /**
   * Returns the list of types available to filter by based on what the selected
   * species is for the current filter
   */
  getFeatureTypes(): Array<string> {
    let genes = this.getGenesForSpecies(this.currentFilter.speciesKey);
    let types = Array.from(new Set(genes.map(g => g.type).filter(t => t))).sort();

    // if the any of the conditions have type selections that aren't valid
    // anymore, revert them to null so that user must choose a new type
    this.currentFilter.conditions.forEach(c => {
      if(c.type !== null && types.indexOf(c.type) < 0) c.type = null;
    });

    return types;
  }

  /**
   * Returns the list of genes associated with the specified species key ('ref',
   * 'comp', or 'both')
   * @param {string} speciesKey - the key associated with a species selection
   */
  getGenesForSpecies(speciesKey: string): Array<Gene> {
    return speciesKey === 'ref' ?
           this.refGenes :
           (speciesKey === 'comp' ? this.compGenes : this.allGenes);
  }

  /**
   * Returns the string that will appear in the species select option for the
   * specified species to include the species name and identifier
   * @param {string} species - the species to generate the option name for
   */
  getOptionName(species: string): string {
    return species !== 'both' ?
      (species === 'ref' ? this.refSpecies.commonName + ' (ref)' :
        this.compSpecies.commonName + ' (comp)') :
      'Both';
  }

  /**
   * Returns the filters that apply only to the specified species
   * @param {string} species - the species to filter the filter conditions by
   */
  getFiltersBySpecies(species: string): Array<Filter> {
    return this.getCreatedFilters().filter(f => f.speciesKey === species);
  }

  /**
   * Returns a list of species of the current filters (construct filter checklist)
   */
  getFilterSpecies(): Array<string> {
    let species = this.getCreatedFilters().map(f => f.speciesKey);
    return Array.from(new Set(species));
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
  getCreatedFilters(): Array<Filter> { return this.filters.filter(f => f.created); }


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
  private getNewFilter(): Filter {
    return new Filter(this.refSpecies, this.compSpecies, this.filters.length);
  }

  /**
   * Sets each of the current filter's ID to its index in the list
   */
  private reassignFilterIDs(): void { this.filters.forEach((f, i) => f.id = i); }

  /**
   * Returns an array of genes that are affected by the current selected filters
   * for the table
   */
  private applyFilters(): Array<Gene> {
    this.refGenes.forEach(g => g.resetFilterStatus());
    this.compGenes.forEach(g => g.resetFilterStatus());

    if(this.anyFiltersSelected()) {
      let filters = this.getCreatedFilters();
      // order matters here because if a gene satisfies an 'exclude' criteria AND
      // an 'include' criteria, the include should take precendence over the
      // exclude; in other words, if a gene satisfies AT LEAST ONE condition, it
      // should be filtered
      this.hideGenes(filters.filter(f => f.hides() && f.selected));
      this.filterGenes(filters.filter(f => !f.hides() && f.selected));

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
   * @param {Array<Gene>} genes - the list of genes to search for matches
   * @param {Array<Filter>} filters - the list of filters to check for matches
   */
  private getMatches(genes: Array<Gene>, filters: Array<Filter>): Array<Gene> {

    return genes.filter(g => {
      for(let i = 0; i < filters.length; i++) {
        if(filters[i].matchesFilter(g)) return true;
      }

      return false;
    });
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified filters as 'hidden'
   * @param {Array<Filter>} filters - list of filters to check genes against
   */
  private hideGenes(filters: Array<Filter>): void {
    let refFilters = filters.filter(f => f.isRefFilter());
    let compFilters = filters.filter(f => f.isCompFilter());

    this.getMatches(this.refGenes, refFilters).forEach(g => g.hide());
    this.getMatches(this.compGenes, compFilters).forEach(g => g.hide());
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified filters as 'filtered'
   * @param {Array<Filter>} filters - list of conditions to check genes against
   */
  private filterGenes(filters: Array<Filter>): void {
    let refFilters = filters.filter(f => f.isRefFilter());
    let compFilters = filters.filter(f => f.isCompFilter());

    this.getMatches(this.refGenes, refFilters).forEach(g => g.filter());
    this.getMatches(this.compGenes, compFilters).forEach(g => g.filter());
  }
}
