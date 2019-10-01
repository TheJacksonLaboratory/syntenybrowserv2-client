import { Species } from './species';
import { FilterCondition, SearchType } from './interfaces';
import { Gene } from './gene';

export class Filter {
  attributes: string[] = [ 'type', 'id', 'symbol', 'chr' ];
  species: any[];

  mode: string = 'Highlight';
  speciesKey: string = 'ref';
  refSpecies: Species;
  compSpecies: Species;
  conditions: FilterCondition[] = [];
  id: number;
  simpleFilterTitle: string;
  filterLabel: string;
  advancedFilter: boolean = false;
  simpleUserInputNeeded: boolean = false;

  selected: boolean = true;
  created: boolean = false;
  editing: boolean = true;

  constructor(ref: Species, comp: Species, id: number) {
    this.refSpecies = ref;
    this.compSpecies = comp;
    this.id = id;
    this.species = [
      {name: 'either species', value: 'both'},
      {name: `${this.refSpecies.commonName} only`, value: 'ref'},
      {name: `${this.compSpecies.commonName} only`, value: 'comp'}
    ];

    // make a new default condition
    this.addNewCondition();
  }


  // Operational Methods

  /**
   * Creates a new condition for the filter (will cause the template to render a
   * condition constructor component for each condition in the filter
   */
  addNewCondition(): void {
    this.conditions.push({
      filterBy: 'attribute',
      attribute: 'type',
      ontology: null,
      type: null,
      qualifier: 'equal',
      exact: true,
      value: '',
      removable: this.conditions.length > 0,
      id: this.conditions.length});
  }

  /**
   * Removes the specified condition from the filter's list of conditions
   * @param {FilterCondition} cond - the condition to remove
   */
  removeCondition(cond: FilterCondition): void {
    // remove the condition from the condition array
    this.conditions.splice(cond.id, 1);

    // fix the ids to reflect the conditions' new positions in the array
    this.conditions.forEach((c, i) => c.id = i);
  }

  /**
   * Sets the text that should appear within a label component, including the
   * filter mode (hiding/highlighting), the conditions and affected species
   */
  setLabel(): void {
    this.filterLabel = `${this.mode} [${this.getStringifiedConditions()}] in ${this.getSpecies()}`;
  }


  // Getter Methods

  /**
   * Returns the list of attributes that should be available to choose for each
   * condition; if the species selection for the filter is reference only, it's
   * pointless to allow filtering by chromosome so remove the option
   */
  getValidAttrs(): string[] {
    return this.speciesKey === 'ref' ?
           this.attributes.filter(a => a !== 'chr') : this.attributes;
  }

  /**
   * Returns the list of ontologies that are available to choose from for each
   * condition given the selected species for the filter
   */
  getValidOntologies(speciesKey: string = this.speciesKey): SearchType[] {
    let refOnts = this.refSpecies.onts;
    let compOnts = this.compSpecies.onts;

    switch (speciesKey) {
      case 'ref': return refOnts;
      case 'comp': return compOnts;
      default: {
        return refOnts.filter(ro => compOnts.map(co => co.value).indexOf(ro.value) >= 0);
      }
    }
  }

  /**
   * Returns the common names of the species that the filter will affect
   */
  getSpecies(): string {
    return (this.speciesKey === 'ref' ? `${this.refSpecies.commonName} only` :
      (this.speciesKey === 'comp' ? `${this.compSpecies.commonName} only` :
        'either species'));
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
    return this.conditions.map(c => this.getCompiledCondition(c)).join(' AND ');
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
    return this.conditions.filter(c => {
      if(c.filterBy === 'attribute') {
        return c.attribute === 'type' ? (c.type === null) : (c.value === '');
      } else {
        return c.ontology === null && c.value === '';
      }
    }).length === 0;
  }

  /**
   * Returns true if the filter applies to the reference features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isRefFilter(): boolean { return this.speciesKey !== 'comp' };

  /**
   * Returns true if the filter applies to the comparison features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isCompFilter(): boolean { return this.speciesKey !== 'ref'; }

  /**
   * Returns true if the filter contains at least one ontology-related condition
   */
  isFilteringByOntologyTerm(): boolean {
    return this.conditions.filter(c => c.filterBy === 'ontology').length > 0;
  }


  // Private Methods

  /**
   * Returns a stringified version of the specified condition so that the
   * condition includes the qualifier
   * @param {FilterCondition} cond - the condition to stringify and make readable
   */
  private getCompiledCondition(cond: FilterCondition): string {
    if(cond.filterBy === 'attribute') {
      let value = cond.attribute === 'type' ? cond.type : cond.value;
      return cond.attribute + this.getQualifier(cond) + value;
    } else {
      return 'genes assoc w/ ' + cond.value;
    }
  }

  /**
   * Returns the value of the condition (by default this is the condition's
   * 'value' attribute but if filtering by type, then we need to get the
   * condition's 'type' attribute which models the type selection)
   * @param {FilterCondition} cond - the condition to get the filter by value of
   */
  private getConditionValue(cond: FilterCondition): string {
    return cond.attribute === 'type' ? cond.type : cond.value;
  }

  /**
   * Returns a stringified qualifier to represent the condition's restriction
   * factor, if applicable (i.e. 'symbol = ufd1' vs 'symbol like ufd1', where
   * 'symbol like ufd1' could return features with names like ufd11 or ufd12)
   * @param {FilterCondition} condition - the condition to get the qualifier for
   */
  private getQualifier(condition: FilterCondition): string {
    let qualifier = condition.qualifier;
    return qualifier.includes('not') ?
           (qualifier.includes('equal') ? ' &ne ' : ' not like ') :
           (qualifier.includes('equal') ? ' = ' : ' like ')
  }

  /**
   * Returns true/false if the specified gene matches the specified condition
   * @param {Gene} gene - the gene to check against the specified condition
   * @param {FilterCondition} cond - the condition to check the specified gene
   *                                 against
   */
  private matchesCondition(gene: Gene, cond: FilterCondition): boolean {
    let geneValue = gene[cond.attribute].toLowerCase();
    let condValue = this.getConditionValue(cond).toLowerCase();

    if(cond.qualifier.includes('not')) {
      return cond.qualifier.includes('equal') ?
        geneValue !== condValue : !geneValue.includes(condValue);
    } else {
      return cond.qualifier.includes('equal') ?
        geneValue === condValue : geneValue.includes(condValue);
    }
  }
}
