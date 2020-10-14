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
