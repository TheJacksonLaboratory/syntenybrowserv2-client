import { Species } from './species';
import { SearchType } from './interfaces';
import { Gene } from './gene';
import { FilterCondition } from './filter-condition';

export class Filter {
  species: any;

  mode: string = 'Highlight';
  refSpecies: Species;
  compSpecies: Species;
  conditions: FilterCondition[] = [];
  id: number;
  simpleFilterTitle: string;
  filterLabel: string;
  advancedFilter: boolean = true;
  simpleUserInputNeeded: boolean = false;

  selected: boolean = true;
  created: boolean = false;
  editing: boolean = true;

  constructor(ref: Species, comp: Species, id: number, advanced: boolean) {
    this.refSpecies = ref;
    this.compSpecies = comp;
    this.id = id;
    this.advancedFilter = advanced;
    this.species = {
      ref: {name: this.refSpecies.commonName, value: 'ref', selected: true},
      comp: {name: this.compSpecies.commonName, value: 'comp', selected: true}
    };

    // make a new default condition
    this.addNewCondition();
  }


  // Operational Methods

  /**
   * Creates a new condition for the filter (will cause the template to render a
   * condition constructor component for each condition in the filter
   */
  addNewCondition(): void {
    let numConditions = this.conditions.length;

    this.conditions.forEach(c => c.editing = false);
    this.conditions.push(new FilterCondition(numConditions));
    this.conditions.forEach(c => c.removable = numConditions > 0);
  }

  /**
   * Removes the specified condition from the filter's list of conditions
   * @param {FilterCondition} cond - the condition to remove
   */
  removeCondition(cond: FilterCondition): void {
    // remove the condition from the condition array
    this.conditions.splice(cond.id, 1);

    // fix the ids to reflect the conditions' new positions in the array
    this.conditions.forEach((c, i, arr) => {
      c.id = i;
      c.removable = arr.length > 1;
    });

    if(this.conditions.length < 2) {

    }
    this.setLabel();
  }

  selectSimpleSpecies(speciesKey: string): void {
    if(speciesKey.includes('either')) {
      this.species.ref.selected = true;
      this.species.comp.selected = true;
    } else if(speciesKey.includes(this.refSpecies.commonName)) {
      this.species.ref.selected = true;
      this.species.comp.selected = false;
    } else {
      this.species.comp.selected = true;
      this.species.ref.selected = false;
    }
  }

  /**
   * Sets the text that should appear within a label component, including the
   * filter mode (hiding/highlighting), the conditions and affected species
   */
  setLabel(): void {
    this.filterLabel = `${this.getStringifiedConditions()} in ${this.getSpecies()}`;
    this.setSimpleTitle();
  }

  /**
   * Sets the label for the simple filter menu button
   */
  setSimpleTitle(): void {
    let c = this.conditions[0];
    if(c.isType()) {
      this.simpleFilterTitle = `that are ${c.value}s in ${this.getSpecies()}`
    } else {
      const filterBy = c.isOntology() ? c.getOntology() + ' term' : c.filterBy;
      const qual = c.qualifier === 'like' ? 'like' : '';
      this.simpleFilterTitle = `in ${this.getSpecies()} by ${filterBy} ${qual}`;
    }
  }


  // Getter Methods

  /**
   * Returns the list of ontologies that are available to choose from for each
   * condition given the selected species for the filter
   */
  getOntologies(): SearchType[] {
    if (this.isRefFilter() && this.isCompFilter()) {
      return this.getMutualOntologies();
    } else if (this.isRefFilter()) {
      return this.refSpecies.onts;
    } else {
      return this.compSpecies.onts;
    }
  }

  /**
   * Returns the common names of the species that the filter will affect
   */
  getSpecies(): string {
    let ref = this.isRefFilter();
    let comp = this.isCompFilter();

    return (ref && !comp ? `${this.refSpecies.commonName} only` :
      (!ref && comp ? `${this.compSpecies.commonName} only` : 'either species'));
  }

  getSimpleSpeciesOptions(): any[] {
    return [
      'either species',
      `${this.refSpecies.commonName} only`,
      `${this.compSpecies.commonName} only`
    ];
  }

  /**
   * Returns the color that text related to this filter should be based on the
   * type of filter it is (hiding/highlighting)
   */
  getColor(): string { return this.hides() ? '#F00' : '#2A9FE0'; }

  /**
   * Returns the label text for the filter based on title (adds formatting)
   */
  getStringifiedConditions(): string {
    return this.conditions.filter(c => c.isComplete())
                          .map(c => c.getCompleteTitle())
                          .join(' AND ');
  }

  /**
   * Returns the stringified, tab-separated details about the filter and its
   * conditions for the purposes of being included in the file representing the
   * table
   */
  getTSVRowForFilter(): string {
    let conds = this.getStringifiedConditions();
    return [ this.mode, this.getSpecies(), conds ].join('\t');
  }


  // Condition Checks

  /**
   * Returns true if the filter is set to hide matching features
   */
  hides(): boolean { return this.mode === 'Hide'; }

  /**
   * Returns true if the specified gene matches ALL of the filter's conditions
   * @param {Gene} gene - the gene to check against all conditions
   */
  matchesFilter(gene: Gene): boolean {
    for(let i = 0; i < this.conditions.length; i++) {
      // as soon as we find a condition the gene doesn't match, return false
      if(!this.matchesCondition(gene, this.conditions[i])) return false;
    }

    return true;
  }

  /**
   * Returns true if all conditions don't have empty or unselected fields
   */
  allConditionsAreComplete(): boolean {
    return this.conditions.filter(c => !c.isComplete()).length === 0;
  }

  /**
   * Returns true if the filter applies to the reference features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isRefFilter(): boolean { return this.species.ref.selected; };

  /**
   * Returns true if the filter applies to the comparison features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isCompFilter(): boolean { return this.species.comp.selected; }

  /**
   * Returns true if the filter contains at least one ontology-related condition
   */
  isFilteringByOntologyTerm(): boolean {
    return this.conditions.filter(c => c.isOntology()).length > 0;
  }


  // Private Methods

  /**
   * Returns the value of the condition (by default this is the condition's
   * 'value' attribute but if filtering by type, then we need to get the
   * condition's 'type' attribute which models the type selection)
   * @param {FilterCondition} cond - the condition to get the filter by value of
   */
  private getConditionValue(cond: FilterCondition): string {
    return cond.value;
  }

  /**
   * Returns true/false if the specified gene matches the specified condition
   * @param {Gene} gene - the gene to check against the specified condition
   * @param {FilterCondition} cond - the condition to check the specified gene
   *                                 against
   */
  private matchesCondition(gene: Gene, cond: FilterCondition): boolean {
    let geneValue = gene[cond.filterBy].toLowerCase();
    let condValue = this.getConditionValue(cond).toLowerCase();

    if(cond.qualifier.includes('not')) {
      return cond.qualifier.includes('equal') ?
        geneValue !== condValue : !geneValue.includes(condValue);
    } else {
      return cond.qualifier.includes('equal') ?
        geneValue === condValue : geneValue.includes(condValue);
    }
  }

  private getMutualOntologies(): SearchType[] {
    return this.refSpecies.onts.filter(ro => {
      return this.compSpecies.onts.map(co => co.value)
                                  .indexOf(ro.value) >= 0;
    })
  }
}
