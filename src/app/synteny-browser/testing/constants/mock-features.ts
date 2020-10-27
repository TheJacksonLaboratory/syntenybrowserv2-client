import { Feature } from '../../classes/feature';

export const SELECTED_FEATURES_NO_SYNTENY = [
  {
    "id": "MGI:1918292",
    "taxon_id": 10090,
    "symbol": "4933401J01Rik",
    "chr": "1",
    "start": 3073253,
    "end": 3074322,
    "strand": "1",
    "type": "unclassified gene"
  },
  {
    "id": "MGI:5455983",
    "taxon_id": 10090,
    "symbol": "Gm26206",
    "chr": "1",
    "start": 3102016,
    "end": 3102125,
    "strand": "1",
    "type": "snRNA gene"
  },
  {
    "id": "MGI:109264",
    "taxon_id": 10090,
    "symbol": "Psmb6-ps2",
    "chr": "1",
    "start": 101385886,
    "end": 101386590,
    "strand": "1",
    "type": "pseudogene"
  }
].map(f => new Feature(f));

export const SELECTED_FEATURE_MULTI_BLOCK = [
  new Feature({
    "id": "MGI:5141853",
    "taxon_id": 10090,
    "symbol": "Gm20388",
    "chr": "8",
    "start": 119910841,
    "end": 124345722,
    "strand": "1",
    "type": "protein coding gene"
  })
];

export const SELECTED_QTL_FEATURES = [
  {
    "taxon_id": 10090,
    "chr": "1",
    "id": "3573901",
    "symbol": "Aaj1",
    "type": "QTL",
    "start": 181004752,
    "end": 192168463
  },
  {
    "taxon_id": 10090,
    "chr": "1",
    "id": "3026891",
    "symbol": "Abbp1",
    "type": "QTL",
    "start": 62907596,
    "end": 120601949
  }
].map(f => new Feature(f));

export const MOUSE_FEATURES_CHR_2 = [
  {
    "id": "MGI:5610620",
    "taxon_id": 10090,
    "symbol": "Gm37392",
    "chr": "2",
    "start": 3065573,
    "end": 3066088,
    "strand": "-1",
    "type": "pseudogene"
  },
  {
    "id": "MGI:5530688",
    "taxon_id": 10090,
    "symbol": "Gm27306",
    "chr": "2",
    "start": 3075107,
    "end": 3075213,
    "strand": "1",
    "type": "miRNA gene"
  },
  {
    "id": "MGI:1920714",
    "taxon_id": 10090,
    "symbol": "1700057A11Rik",
    "chr": "2",
    "start": 3148802,
    "end": 3149230,
    "strand": "0",
    "type": "unclassified gene"
  }
].map(f => new Feature(f));

export const HUMAN_FEATURES_CHR_1 = [
  {
    "id": "100287102",
    "taxon_id": 9606,
    "symbol": "DDX11L1",
    "chr": "1",
    "start": 11874,
    "end": 14409,
    "strand": "1",
    "type": "gene"
  },
  {
    "id": "102466751",
    "taxon_id": 9606,
    "symbol": "MIR6859-1",
    "chr": "1",
    "start": 17369,
    "end": 17436,
    "strand": "-1",
    "type": "gene"
  }
].map(f => new Feature(f));

export const HUMAN_FEATURES_CHR_3 = [
  {
    "id": "102723448",
    "taxon_id": 9606,
    "symbol": "LINC01986",
    "chr": "3",
    "start": 11751,
    "end": 24501,
    "strand": "1",
    "type": "gene"
  },
  {
    "id": "105376921",
    "taxon_id": 9606,
    "symbol": "LOC105376921",
    "chr": "3",
    "start": 54198,
    "end": 67717,
    "strand": "1",
    "type": "gene"
  },
  {
    "id": "107986040",
    "taxon_id": 9606,
    "symbol": "LOC107986040",
    "chr": "3",
    "start": 67885,
    "end": 70120,
    "strand": "1",
    "type": "gene"
  }
].map(f => new Feature(f));
