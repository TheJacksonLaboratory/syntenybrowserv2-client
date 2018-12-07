export interface Response {
  species?: Array<RawSpecies>;
  genes?: Array<any>;
  blocks?: Array<SyntenyBlock>;
  qtls?: Array<QTLMetadata>;
  ont_genes?: Array<OntologyGeneMetadata>;

}

export interface RawSpecies {
  ref_taxonid: number
}

export interface Chromosome {
  chr: string;
  size: number;
}

export interface SearchType {
  name: string;
  value: string;
  search_example: string;
  search_type: string;
}

export interface ExternalResource {
  name: string;
  url: string;
}

export interface Metadata {
  term_id?: string;
  term_name?: string;
  qtl_id?: string;
  qtl_symbol?: string;
  gene_id?: string;
  gene_symbol?: string;
  gene_type?: string;
  chr: string;
  strand?: string;
  start: number;
  end: number;
}

export interface OntologyGeneMetadata extends Metadata {
  term_id: string;
  term_name: string;
  gene_id: string;
  gene_symbol: string;
  gene_type: string;
  chr: string;
  strand: string;
  start: number;
  end: number;
}

export interface QTLMetadata extends Metadata {
  qtl_id: string;
  qtl_symbol: string;
  chr: string;
  start: number;
  end: number;
}

export interface SyntenyBlock {
  comp_chr: string;
  comp_start?: number;
  comp_end?: number;
  ref_chr: string;
  ref_start: number;
  ref_end: number;
  id?: string;
  orientation_matches?: boolean;
  true_orientation?: any;
  match_orientation?: any;
}

export interface CartesianCoordinate {
  x: number;
  y: number;
}

export interface SelectedFeatures {
  chr: string;
  features: Array<string>;
}

export interface BrowserInterval {
  start: number;
  end: number;
  width: number;
}

export interface Exon {
  exon_start_pos: number;
  exon_end_pos: number;
}

export interface Gene {
  canonical_transcript: Array<Exon>;
  end_pos?: number;
  gene_id: string;
  gene_symbol: string;
  gene_start_pos?: number;
  gene_end_pos?: number;
  gene_chr?: string;
  block_id?: string;
  homologs?: Array<Gene>;
  homolog_id?: number;
  homolog_ids?: Array<number>;
  start_pos?: number;
  strand: string;
  type: string;
}

export interface GeneMetadata extends Metadata {
  gene_id: string;
  gene_symbol: string;
  gene_type: string;
  chr: string;
  strand: string;
  start: number;
  end: number;
}
