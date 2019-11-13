/**
 * This class is to be used within a Filter class as a single filter can have
 * multiple conditions
 * @var filterBy - string attribute to filter genes by
 * @var qualifier - string value equivalent of how matches should be found
 *                  (options are equal, like, not equal, not like)
 * @var exact - boolean that will be used for ontology conditions (exact = true,
 *              match genes that are associated with term selected; exact =
 *              false, match genes that are associated with terms that match the
 *              input value
 * @var value - the actual string value to match genes against
 * @var removable - a boolean describing whether the condition is removable from
 *                  the list of conditions (within the filter) which is true
 *                  unless the condition is the ONLY one
 * @var id - the numeric id of the condition for identification purposes within
 *           a filter's condition list
 * @var editing - a boolean describing whether the condition is currently in
 *                edit mode or not
 */
export class FilterCondition {
  filterBy: string = '';
  qualifier = 'equal';
  exact = true;
  value: string;
  removable: boolean;
  id: number;
  editing = true;

  constructor(id: number) {
    this.id = id;
  }

  /**
   * Returns the title of the filter condition
   */
  getCompleteTitle(): string {
    if(this.filterBy === 'chr') {
      return 'Chr' + this.value;
    } else if(this.isType()) {
      return this.value + 's';
    } else if(this.isOntology()) {
      return this.value;
    } else {
      return `${this.filterBy} ${this.getQualifierString()} ${this.value}`;
    }
  }

  /**
   * Returns the selected ontology abbreviation from the filter by its value
   */
  getOntology(): string { return this.filterBy.replace('ont-', ''); }

  /**
   * Returns true if the filter by is by gene ID or gene symbol
   */
  requiresInput(): boolean {
    return this.filterBy === 'id' || this.filterBy === 'symbol';
  }

  /**
   * Returns true if the current type value isn't present in the specified list
   * of types
   * @param {string[]} types - valid types to choose from given the current species
   */
  hasInvalidType(types: string[]): boolean {
    return this.isType() ? types.indexOf(this.value) < 0 : false;
  }

  /**
   * Returns true if all the necessary fields are filled with values
   */
  isComplete(): boolean {
    return !!(this.filterBy && this.qualifier && this.value);
  }

  /**
   * Returns true if this condition is related to an ontology
   */
  isOntology(): boolean { return this.filterBy.includes('ont-'); }

  /**
   * Returns true if this condition is related to feature type
   */
  isType(): boolean { return this.filterBy === 'type'; }

  /**
   * Returns a converted value from the qualifier select value to a
   * human-readable value for a label
   */
  private getQualifierString(): string {
    return this.qualifier.includes('not') ?
      (this.qualifier.includes('equal') ? '&ne' : 'not like') :
      (this.qualifier.includes('equal') ? '=' : 'like')
  }
}
