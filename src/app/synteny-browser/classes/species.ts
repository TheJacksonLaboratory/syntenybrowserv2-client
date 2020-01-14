import { ExternalResource, SearchType } from './interfaces';

export class Species {
  taxonID: number;

  name: string;

  abbrev: string;

  commonName: string;

  genome: any;

  onts: SearchType[];

  searchTypes: SearchType[];

  hasQTLs: boolean;

  resources: ExternalResource[];

  /**
   * Creates a Species object
   * @param {any} species - the raw species object from the API
   */
  constructor(species: any) {
    this.name = species.name;
    this.abbrev = species.name
      .split(' ')
      .map(w => w[0].toUpperCase())
      .join('');
    this.commonName = species.alias;
    this.taxonID = species.id;
    this.resources = species.resources;
    this.genome = species.genome;
    // TODO: species config lists humans as having QTLs; fix this
    this.hasQTLs = species.id === 10090;
    this.searchTypes = species.searches;
    this.onts = species.ontologies;
  }

  /**
   * Returns the taxon ID in string form
   */
  getID(): string {
    return this.taxonID.toString();
  }

  /**
   * Returns the chromsome values in the genome
   */
  getChromosomes(): string[] {
    return Object.keys(this.genome);
  }

  /**
   * Returns the sum of all chromosomes in the genome (total size of the genome)
   */
  getGenomeSize(): number {
    return Object.values(this.genome).reduce((a: number, b: number) => a + b) as number;
  }

  /**
   * Returns the number of chromosomes in the genome
   */
  getNumChrs(): number {
    return this.getChromosomes().length;
  }
}
