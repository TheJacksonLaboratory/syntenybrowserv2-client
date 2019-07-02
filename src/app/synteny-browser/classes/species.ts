import { ExternalResource, SearchType } from './interfaces';

export class Species {
  taxonID: number;
  name: string;
  commonName: string;
  genome: any;
  onts: Array<SearchType>;
  searchTypes: Array<SearchType>;
  hasQTLs: boolean;
  resources: Array<ExternalResource>;

  /**
   * Creates a Species object
   * @param {number} taxonID - taxon ID of the species to create
   */
  constructor(taxonID: number) {
    this.taxonID = taxonID;

    if(taxonID !== 0) {
      // TODO: hardcoding until we get the necessary data into the API
      (this.taxonID === 10090) ? this.createMouse() : this.createHuman();
    } else {
      this.createDummySpecies();
    }
  }

  /**
   * Returns the taxon ID in string form
   */
  getID(): string {
    return this.taxonID.toString();
  }

  /**
   * Creates a MOUSE species
   * TODO: GET RID OF THIS WHEN DB HAS NECESSARY DATA
   */
  private createMouse() {
    this.name = 'Mus musculus';
    this.commonName = 'Mouse';
    this.resources = [
      {url: 'http://www.informatics.jax.org/marker/', name: 'MGI'}
    ];
    this.genome = {
      '1': 195471971, '2': 182113224, '3': 160039680, '4': 156508116,
      '5': 151834684, '6': 149736546, '7': 145441459, '8': 129401213,
      '9': 124595110, '10': 130694993, '11': 122082543, '12': 120129022,
      '13': 120421639, '14': 124902244, '15': 104043685, '16': 98207768,
      '17': 94987271, '18': 90702639, '19': 61431566, 'X': 171031299,
      'Y': 91744698
    };
    this.hasQTLs = true;
    this.searchTypes = [
      {name: 'Feature Symbol', value: 'symbol'},
      {name: 'Ontology', value: 'ontology'}
    ];
    this.onts = [
      {value: 'go', name: 'Gene Ontology'},
      {value: 'mp', name: 'Mammalian Phenotype Ontology'}
    ];
  }

  /**
   * Creates a HUMAN species
   * TODO: GET RID OF THIS WHEN DB HAS NECESSARY DATA
   */
  private createHuman() {
    this.name = 'Homo sapiens';
    this.commonName = 'Human';
    this.resources = [
      {url: 'https://www.ncbi.nlm.nih.gov/gene/', name: 'NCBI'}
    ];
    this.genome = {
      '1': 249250621, '2': 243199373, '3': 198022430, '4': 191154276,
      '5': 180915260, '6': 171115067, '7': 159138663, '8': 146364022,
      '9': 141213431, '10': 135534747, '11': 135006516, '12': 133851895,
      '13': 115169878, '14': 107349540, '15': 102531392, '16': 90354753,
      '17': 81195210, '18': 78077248, '19': 59128983, '20': 63025520,
      '21': 48129895, '22': 51304566, 'X': 155270560, 'Y': 59373566
    };
    this.hasQTLs = false;
    this.searchTypes = [
      {name: 'Feature Symbol', value: 'symbol'},
      {name: 'Ontology', value: 'ontology'}
    ];
    this.onts = [
      {value: 'go', name: 'Gene Ontology'},
      {value: 'doid', name: 'Disease Ontology'}
    ];
  }

  /**
   * Creates a dummy species (for testing purposes until we aren't hardcoding
   * all the data within the class)
   * TODO: GET RID OF THIS WHEN DB HAD NECESSARY DATA
   */
  private createDummySpecies() {
    this.name = 'Dumo Demidas';
    this.commonName = 'Demigod';
    this.resources = [
      {url: 'https://url.to-somewhere.com', name: 'Somewhere'}
    ];
    this.genome = {
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      '10': 10, '11': 11, '12': 12, '13': 13, '14': 14, '15': 15, '16': 16,
      '17': 17, '18': 18, '19': 19, '20': 20, '21': 21, '22': 22, 'X': 23, 'Y': 24
    };
    this.hasQTLs = false;
    this.onts = [ // Same as human
      {value: 'go', name: 'Gene Ontology'},
      {value: 'doid', name: 'Disease Ontology'}
    ];
  };
}
