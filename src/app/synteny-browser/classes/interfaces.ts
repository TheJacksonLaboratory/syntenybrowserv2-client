import { Feature } from './feature';
import { SyntenyBlock } from './synteny-block';
import { ClrLoadingState } from '@clr/angular';

export interface ArrayResponse extends Array<any> {}
export interface JSONResponse extends Object {}

export interface OntologyTerm {
  id: string;
  name: string;
  count?: number;
  namespace?: string;
  descendants?: DescendantTerm[];
  def?: string;
  selecting?: ClrLoadingState;
}

export interface DescendantTerm {
  id: string;
  name: string;
}

export interface RawSpecies {
  ref_taxonid: number
}

export interface Chromosome {
  chr: string;
  size: number;
}
export interface Option {
  name: string;
  value: string;
}

export interface BlockViewBrowserOptions {
  symbols: boolean;
  anchors: boolean;
  trueOrientation: boolean;
}

export interface SearchType extends Option { }

export interface NavigationObject extends Option { }

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

export interface CartesianCoordinate {
  x: number;
  y: number;
}

export interface SelectedFeatures {
  chr: string;
  features: Feature[];
}

export interface ComparisonBlockCoordinates {
  compStart: number;
  compEnd: number;
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

export interface ComparisonScaling {
  match: object;
  true: object;
}

export interface Exon {
  start: number;
  end: number;
}

export interface ReferenceChr {
  chr: string;
  size: number;
  blocks: SyntenyBlock[];
}

export interface RadiiDictionary {
  ringInner: number;
  ringOuter: number;
  labels?: number;
}
