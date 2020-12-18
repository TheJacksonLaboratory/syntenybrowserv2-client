import { SearchType, Species } from './species';
import { Gene } from './gene';

export class Filter {
  // data for species a filter could apply to
  species: any;

  // filter mode ('highlight' or 'hide')
  mode = 'highlight';

  // currently selected reference species
  refSpecies: Species;

  // currently selected comparison species
  compSpecies: Species;

  // attribute to filter features by (ontology term, symbol, id, type, etc.)
  filterBy = '';

  // qualifier to change how matches are found (equal, not equal, like, not like)
  qualifier = 'equal';

  // value to match features against when searching utilizing user input
  value = '';

  // ID for the filter to identify it from other possible filters
  id: number;

  // title that is generated from using the simple creation interface
  simpleFilterTitle: string;

  // value to display in the tag to identify the filter to the user
  filterLabel: string;

  // controls whether an input is needed for the user to enter a value as a result of
  // their selection(s) from the simple creation interface
  simpleUserInputNeeded = false;

  // indicates if the filter has been created and is displayed in the list of filters
  created = false;

  // indicates if the filter is currently being edited
  editing = true;

  constructor(ref: Species, comp: Species, id: number) {
    this.refSpecies = ref;
    this.compSpecies = comp;
    this.id = id;
    this.species = {
      ref: { name: this.refSpecies.commonName, value: 'ref', selected: true },
      comp: { name: this.compSpecies.commonName, value: 'comp', selected: true },
    };
  }

  /**
   * Marks the appropriate species as (de)selected
   * @param {string} speciesKey - the value associated with the selected species
   */
  selectSimpleSpecies(speciesKey: string): void {
    if (speciesKey.includes('either')) {
      this.species.ref.selected = true;
      this.species.comp.selected = true;
    } else if (speciesKey.includes(this.refSpecies.commonName)) {
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
    this.filterLabel = `${this.getCompleteTitle()} in ${this.getSpecies()}`;
    this.setSimpleTitle();
  }

  /**
   * Sets the label for the simple filter menu button
   */
  setSimpleTitle(): void {
    if (this.filtersOnType()) {
      this.simpleFilterTitle = `that are ${this.value}s in ${this.getSpecies()}`;
    } else {
      const filterBy = this.filtersOnOntology() ? `${this.getOntology()} term` : this.filterBy;
      const qual = this.qualifier === 'like' ? 'like' : '';
      this.simpleFilterTitle = `in ${this.getSpecies()} by ${filterBy} ${qual}`;
    }
  }

  /**
   * Returns the list of ontologies that are available to choose from for each
   * condition given the selected species for the filter
   */
  getOntologies(): SearchType[] {
    if (this.isRefFilter() && this.isCompFilter()) {
      return this.getMutualOntologies();
    }
    if (this.isRefFilter()) {
      return this.refSpecies.onts;
    }
    return this.compSpecies.onts;
  }

  /**
   * Returns the common names of the species that the filter will affect
   */
  getSpecies(): string {
    const ref = this.isRefFilter();
    const comp = this.isCompFilter();

    if (ref && comp) {
      return 'either species';
    }
    if (ref && !comp) {
      return `${this.refSpecies.commonName} only`;
    }

    if (!ref && comp) {
      return `${this.compSpecies.commonName} only`;
    }

    return null;
  }

  /**
   * Returns a list of option titles for species selection in simple filter mode
   */
  getSimpleSpeciesOptions(): any[] {
    return [
      'either species',
      `${this.refSpecies.commonName} only`,
      `${this.compSpecies.commonName} only`,
    ];
  }

  /**
   * Returns the color that text related to this filter should be based on the
   * type of filter it is (hiding/highlighting)
   */
  getColor(): string {
    return this.hides() ? '#F00' : '#2A9FE0';
  }

  /**
   * Returns the title of the filter condition
   */
  getCompleteTitle(): string {
    if (this.filterBy === 'chr') {
      return `Chr${this.value}`;
    }
    if (this.filtersOnType()) {
      return `${this.value}s`;
    }
    if (this.filtersOnOntology()) {
      return this.value;
    }
    return `${this.filterBy} ${this.getQualifierString()} ${this.value}`;
  }

  /**
   * Returns the stringified, tab-separated details about the filter and its
   * conditions for the purposes of being included in the file representing the
   * table
   */
  getTSVRowForFilter(): string {
    const conds = this.getCompleteTitle();
    return [this.mode, this.getSpecies(), conds].join('\t');
  }

  /**
   * Returns the selected ontology abbreviation from the filter by its value
   */
  getOntology(): string {
    return this.filterBy.replace('ont-', '');
  }

  /**
   * Returns true if the filter is set to hide matching features
   */
  hides(): boolean {
    return this.mode === 'hide';
  }

  /**
   * Returns true if the current type value isn't present in the specified list
   * of types
   * @param {string[]} types - valid types to choose from given the current species
   */
  hasInvalidType(types: string[]): boolean {
    return this.filtersOnType() ? types.indexOf(this.value) < 0 : false;
  }

  /**
   * Returns true if the filter is finding matches based on type
   */
  filtersOnType(): boolean {
    return this.filterBy === 'type';
  }

  /**
   * Returns true if the filter is finding matches based on an ontology term
   */
  filtersOnOntology(): boolean {
    return this.filterBy.includes('ont-');
  }

  /**
   * Returns true if the specified gene matches ALL of the filter's conditions
   * @param {Gene} gene - the gene to check against all conditions
   */
  matchesFilter(gene: Gene): boolean {
    const geneValue = gene[this.filterBy].toLowerCase();
    const condValue = this.value.toLowerCase();

    if (this.qualifier.includes('not')) {
      return this.qualifier.includes('equal')
        ? geneValue !== condValue
        : !geneValue.includes(condValue);
    }
    return this.qualifier.includes('equal')
      ? geneValue === condValue
      : geneValue.includes(condValue);
  }

  /**
   * Returns true if all fields are complete/have values
   */
  isComplete(): boolean {
    return !!(this.filterBy && this.qualifier && this.value);
  }

  /**
   * Returns true if the filter applies to the reference features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isRefFilter(): boolean {
    return this.species.ref.selected;
  }

  /**
   * Returns true if the filter applies to the comparison features; the
   * boolean condition takes into consideration if the species selection is both
   * species
   */
  isCompFilter(): boolean {
    return this.species.comp.selected;
  }

  /**
   * Returns true if the filter contains at least one ontology-related condition
   */
  isFilteringByOntologyTerm(): boolean {
    return this.filterBy.includes('ont-');
  }

  /**
   * Returns list of search ontologies that exist for both species for
   * filtering by ontology options
   */
  private getMutualOntologies(): SearchType[] {
    return this.refSpecies.onts.filter(
      ro => this.compSpecies.onts.map(co => co.value).indexOf(ro.value) >= 0,
    );
  }

  /**
   * Returns a converted value from the qualifier select value to a
   * human-readable value for a label
   */
  private getQualifierString(): string {
    if (this.qualifier.includes('not')) {
      return this.qualifier.includes('equal') ? '&ne' : 'not like';
    }

    return this.qualifier.includes('equal') ? '=' : 'like';
  }
}
