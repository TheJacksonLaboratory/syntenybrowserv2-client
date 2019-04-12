import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Species } from '../classes/species';
import { FilterCondition, NavigationObject } from '../classes/interfaces';
import { Gene } from '../classes/gene';
import { ClrDatagridPagination } from '@clr/angular';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
  @Input() refSpecies: Species;
  @Input() compSpecies: Species;
  @Input() filters: Array<FilterCondition>;
  @Input() refGenes: Array<Gene>;
  @Input() compGenes: Array<Gene>;

  navigation: Array<NavigationObject>;
  activePage: string = 'preview';

  currentFilter: string = '';
  conditionSpecies: string = 'both';
  filterErrorState: string = null;
  filterTestResults: string = null;
  validAttrs: Array<string>;
  speciesOptions: Array<string>;
  filterMode: string = 'add';
  editingFilter: FilterCondition = null;

  allGenes: Array<Gene>;
  filteredGenes: Array<Gene>;

  @Output() userClose: EventEmitter<any> = new EventEmitter();

  constructor() {
    this.validAttrs = [ 'id', 'symbol', 'chr', 'type' ];
    this.speciesOptions = [ 'both', 'ref', 'comp' ];
    this.navigation = [ { name: 'edit filters', value: 'edit' },
                        { name: 'preview filters', value: 'preview' },
                        { name: 'filtering guide', value: 'guide' } ];
  }

  ngOnInit(): void {
    this.allGenes = this.refGenes.concat(... this.compGenes);
    this.filteredGenes = [];
  }


  // Operational Methods

  /**
   * Updates the list of filters with the filters that are marked as selected
   * from the filter checklist in the preview page of the modal
   */
  applyFilterSelections(): void {
    this.filters = this.filters.filter(f => f.selected)
  }

  /**
   * Marks a filter as being edited so that when it's submitted it won't be
   * added as a new filter and moves the species selection and condition to the
   * select and input fields to be edited
   * @param {FilterCondition} filterToEdit - the filter that is being edited
   */
  editThisFilter(filterToEdit: FilterCondition): void {
    this.filterMode = 'edit';
    this.currentFilter = filterToEdit.title;
    this.conditionSpecies = filterToEdit.species;
    this.editingFilter = filterToEdit;
  }

  /**
   * Depending on what keys are pressed, adds a new filter, changes an
   * existing filter, or tests a filter based on the current user input in
   * fields
   * @param {KeyboardEvent} event - event object for a key press, if any
   */
  processFilter(event: KeyboardEvent = null): void {
    // if no event (button click) or just "Enter", add the filter or edit it
    if(!event || (event.key === 'Enter' && !event.shiftKey)) {
      // if we're in adding mode, add a new filter
      if(this.filterMode === 'add') {
        this.addFilter();
      // if we're in editing mode, find the original filter condition that is
      // edited and replace it
      } else {
        let origFilter = this.editingFilter;
        let i = this.filters.map(f => f.species + ', ' + f.title)
                            .indexOf(origFilter.species + ', ' + origFilter.title);
        this.filters[i] = this.createNewFilter();

        // return all filter fields and mode to defaults
        this.filterMode = 'add';
        this.editingFilter = null;
        this.currentFilter = '';
        this.filterErrorState = null;
        this.filterTestResults = null;
      }
    // if the key event is a "Shift+Enter", test run the filter
    } else if(event && event.key === 'Enter' && event.shiftKey) {
      this.testFilter();
    }
  }

  /**
   * Adds a filter object to the list by parsing the user input
   */
  addFilter(): void {
    this.filterErrorState = null;
    this.filterTestResults = null;

    let newFilter = this.createNewFilter();

    if(newFilter) {
      this.filters.push(newFilter);
      this.currentFilter = '';
      this.filterErrorState = null;
      this.filterTestResults = null;
    }
  }

  /**
   * Removes the specified filter from the list of filters
   * @param {string} conditionTitle - the title of the filter to remove
   */
  removeFilter(conditionTitle: string): void {
    this.filters = this.filters.filter(f => f.title !== conditionTitle);
  }

  /**
   * Tests the filter (don't add it), get the number of features that the filter
   * that the current state of input fields would affect and print the number of
   * features under the condition inputs
   */
  testFilter(): void {
    // clear what's there now
    this.filterErrorState = null;
    this.filterTestResults = null;

    // if the condition is complete enough to consider a proper condition,
    // continue getting data
    if(this.currentFilter.includes('=')) {
      let filter = this.createNewFilter();
      let numGenes;

      // if the filter was created without any errors (errors will cause 'filter'
      // to be null) get the number of genes
      if(filter) {
        if(filter.species === 'ref') {
          numGenes = this.getMatches(this.refGenes, [filter]).length;
        } else if(filter.species === 'comp') {
          numGenes = this.getMatches(this.compGenes, [filter]).length;
        } else {
          numGenes = this.getMatches(this.allGenes, [filter]).length;
        }

        this.filterTestResults = `This filter will 
                                  ${filter.include ? 'highlight' : 'hide'} 
                                  ${numGenes} 
                                  ${numGenes === 1 ? 'feature' : 'features'}`;
      }
    }
  }

  /**
   * Updates the specified filter condition selected flag based on the event
   * value and apply the selected filters to the feature table
   * @param {FilterCondition} changedFilter - filter that's being (de)selected
   * @param {number} event - event code; 0 (deselected) or 1 (selected)
   */
  runFilters(changedFilter: FilterCondition, event: number): void {
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

    let lines = '[FILTER DATA]\nfilter type,species,attr,value\n' +
                this.filters.filter(f => f.selected)
                            .map(f => this.getFilterDataRow(f)).join('\n') +
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
  getFiltersBySpecies(species: string): Array<FilterCondition> {
    return this.filters.filter(f => f.species === species);
  }

  /**
   * Returns the label text for the specified condition title (adds formatting)
   * @param {string} condTitle - the title of the condition
   */
  getConditionLabel(condTitle: string): string {
    return condTitle.replace(/=/g, ' = ').replace(/!/g, '').replace(/\+/g, ' ');
  }

  /**
   * Returns a list of species of the current filters (construct filter checklist)
   */
  getFilterSpecies(): Array<string> {
    let species = this.filters.map(f => f.species);
    return Array.from(new Set(species));
  }

  /**
   * Returns a style configuration object for a navigation item in the sidebar
   * to determine font weight for the specified page (makes active page bold)
   * @param {string} pageTitle - the title of the page
   */
  getNavItemStyle(pageTitle: string): any {
    return { 'font-weight': this.activePage === pageTitle ? 'bold' : 'normal' };
  }

  /**
   * Returns the label for the paginator for the table based on how many
   * results are being displayed
   * @param {ClrDatagridPagination} pagination - the paginator data structure
   */
  getPaginatorLabel(pagination: ClrDatagridPagination): string {
    return (this.filteredGenes && this.filteredGenes.length > 10) ?
           `${pagination.firstItem + 1} - ${pagination.lastItem + 1} 
           of ${pagination.totalItems}` : this.getSinglePagePaginatorLabel();
  }

  /**
   * Creates/returns a new filter condition object with the current state of
   * input fields
   */
  createNewFilter(): FilterCondition {
    let condition = this.currentFilter;
    let attr;
    let value;

    if(condition.includes(' ')) {
      this.filterErrorState = "Replace any spaces with '+'";
      return;
    } else {
      attr = condition.split('=')[0].toLowerCase();
      value = condition.split('=')[1].toLowerCase();
    }

    if(this.validAttrs.indexOf(attr.replace(/!/g, '')) < 0) {
      this.filterErrorState = 'Invalid attribute name';
      return;
    } else {
      return { title: condition,
        species: this.conditionSpecies,
        attr: attr.replace(/!/g, ''),
        value: value.replace(/\+/g, ' '),
        include: !(attr.includes('!')),
        selected: true }
    }
  }

  /**
   * Returns an array of genes that are affected by the current (selected in
   * the filter checklist) filters for the table
   */
  applyFilters(): Array<Gene> {
    this.refGenes.forEach(g => g.resetFilterStatus());
    this.compGenes.forEach(g => g.resetFilterStatus());

    // order matters here because if a gene satisfies an 'exclude' criteria AND
    // an 'include' criteria, the include should take precendence over the
    // exclude; in other words, if a gene satisfies AT LEAST ONE condition, it
    // should be filtered
    this.hideGenes(this.filters.filter(f => !f.include && f.selected));
    this.filterGenes(this.filters.filter(f => f.include && f.selected));

    return this.refGenes.concat(...this.compGenes)
      .filter(g => g.filtered || g.hidden);
  }


  // Condition Checks

  /**
   * Returns true/false if all of the filters are currently selected
   */
  allFiltersSelected(): boolean {
    return this.filters.length === this.filters.filter(f => f.selected).length;
  }


  // Private Methods

  /**
   * Returns a customized results description for a set of results that don't
   * need a proper paginator (10 or fewer)
   */
  private getSinglePagePaginatorLabel(): string {
    let numRows = this.filteredGenes.length;
    return numRows > 0 ? `1 - ${numRows} of ${numRows}` : '0 of 0';
  }

  /**
   * Returns the species name(s) given the species value from a filter condition
   * @param {string} speciesKey - species from filter condition (ref, comp, both)
   */
  private getSpeciesName(speciesKey: string): string {
    let ref = this.refSpecies.commonName;
    let comp = this.compSpecies.commonName;
    return speciesKey === 'both' ?
           ref + ' and ' + comp : (speciesKey === 'ref' ? ref : comp)
  }

  /**
   * Returns a tsv-like string for a filter that includes the filter mode
   * (highlight/hide), the species name(s), the filter attribute (symbol, id,
   * chr, type), and value
   * @param {FilterCondition} filter - the filter to get data for
   */
  private getFilterDataRow(filter: FilterCondition): string {
    let mode = filter.include ? 'highlight' : 'hide';
    let species = this.getSpeciesName(filter.species);
    return [ mode, species , filter.attr, filter.value ].join('\t');
  }

  /**
   * Returns a subset of genes from the specified list of genes that match at
   * least one of the specified list of conditions
   * @param {Array<Gene>} genes - the list of genes to search for matches
   * @param {Array<any>} conditions - the list of conditions to check for matches
   */
  private getMatches(genes: Array<Gene>, conditions: Array<any>): Array<Gene> {
    return genes.filter(g => {
      let matchesFilter = false;
      conditions.forEach(c => {
        let cond = c.attr.toLowerCase();
        let val = c.value.toLowerCase();
        g[cond].toLowerCase() === val ?
          matchesFilter = true : null
      });
      return matchesFilter;
    });
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified conditions as 'hidden'
   * @param {Array<any>} conditions - list of conditions to check genes against
   */
  private hideGenes(conditions: Array<any>): void {
    let refConds = conditions.filter(c => c.species !== 'comp');
    let compConds = conditions.filter(c => c.species !== 'ref');
    let hiddenRefGenes = this.getMatches(this.refGenes, refConds);
    hiddenRefGenes.forEach(g => g.hide());

    let hiddenCompGenes = this.getMatches(this.compGenes, compConds);
    hiddenCompGenes.forEach(g => g.hide());
  }

  /**
   * Marks all reference and comparison genes that match at least one of the
   * specified conditions as 'filtered'
   * @param {Array<any>} conditions - list of conditions to check genes against
   */
  private filterGenes(conditions: Array<any>): void {
    let refConds = conditions.filter(c => c.species !== 'comp');
    let compConds = conditions.filter(c => c.species !== 'ref');
    let filteredRefGenes = this.getMatches(this.refGenes, refConds);
    filteredRefGenes.forEach(g => g.filter());

    let filteredCompGenes = this.getMatches(this.compGenes, compConds);
    filteredCompGenes.forEach(g => g.filter());
  }
}
