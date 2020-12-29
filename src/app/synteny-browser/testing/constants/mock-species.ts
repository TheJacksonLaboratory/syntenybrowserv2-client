export const MOUSE = {
  order: 0,
  organism: {
    name: 'Mus musculus',
    alias: 'Mouse',
    id: 10090,
    resources: [
      {
        url: 'http://www.informatics.jax.org/marker/',
        name: 'MGI',
      },
    ],
    genome: {
      '1': 195471971,
      '2': 182113224,
      '3': 160039680,
      '4': 156508116,
      '5': 151834684,
      '6': 149736546,
      '7': 145441459,
      '8': 129401213,
      '9': 124595110,
      '10': 130694993,
      '11': 122082543,
      '12': 120129022,
      '13': 120421639,
      '14': 124902244,
      '15': 104043685,
      '16': 98207768,
      '17': 94987271,
      '18': 90702639,
      '19': 61431566,
      X: 171031299,
      Y: 91744698,
    },
    qtls: true,
    searches: [
      {
        name: 'Feature Attribute',
        value: 'symbol',
      },
      {
        name: 'Ontology',
        value: 'ontology',
      },
    ],
    ontologies: [
      {
        name: 'Gene Ontology',
        value: 'go',
      },
      {
        name: 'Mammalian Phenotype Ontology',
        value: 'mp',
      },
    ],
  },
};

export const HUMAN = {
  order: 1,
  organism: {
    name: 'Homo sapiens',
    alias: 'Human',
    id: 9606,
    resources: [
      {
        url: 'https://www.ncbi.nlm.nih.gov/gene/',
        name: 'NCBI',
      },
    ],
    genome: {
      '1': 249250621,
      '2': 243199373,
      '3': 198022430,
      '4': 191154276,
      '5': 180915260,
      '6': 171115067,
      '7': 159138663,
      '8': 146364022,
      '9': 141213431,
      '10': 135534747,
      '11': 135006516,
      '12': 133851895,
      '13': 115169878,
      '14': 107349540,
      '15': 102531392,
      '16': 90354753,
      '17': 81195210,
      '18': 78077248,
      '19': 59128983,
      '20': 63025520,
      '21': 48129895,
      '22': 51304566,
      X: 155270560,
      Y: 59373566,
    },
    qtls: false,
    searches: [
      {
        name: 'Feature Attribute',
        value: 'symbol',
      },
      {
        name: 'Ontology',
        value: 'ontology',
      },
    ],
    ontologies: [
      {
        name: 'Gene Ontology',
        value: 'go',
      },
      {
        name: 'Disease Ontology',
        value: 'doid',
      },
    ],
  },
};

export const RAT = {
  order: 2,
  organism: {
    name: 'Rattus norvegicus',
    alias: 'Rat',
    id: 10116,
    resources: [
      {
        url: 'https://rgd.mcw.edu/',
        name: 'RGD',
      },
    ],
    genome: {
      '1': 282763074,
      '2': 266435125,
      '3': 177699992,
      '4': 184226339,
      '5': 173707219,
      '6': 147991367,
      '7': 145729302,
      '8': 133307652,
      '9': 122095297,
      '10': 112626471,
      '11': 90463843,
      '12': 52716770,
      '13': 114033958,
      '14': 115493446,
      '15': 111246239,
      '16': 90668790,
      '17': 90843779,
      '18': 88201929,
      '19': 62275575,
      '20': 56205956,
      X: 159970021,
      Y: 3310458,
    },
    qtls: false,
    searches: [
      {
        name: 'Feature Attribute',
        value: 'symbol',
      },
      {
        name: 'Ontology',
        value: 'ontology',
      },
    ],
    ontologies: [
      {
        name: 'Gene Ontology',
        value: 'go',
      },
    ],
  },
};

export const EMPTY_MOUSE = {
  name: 'Mus musculus',
  alias: 'Mouse',
  id: 10090,
  resources: [],
  genome: {},
  qtls: true,
  searches: [],
  ontologies: [],
};
