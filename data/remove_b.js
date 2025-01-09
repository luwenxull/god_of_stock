const ents = require('./industry.v2.json');

const ents_a = ents.filter(ent => ent.SECNAME.endsWith('B'));

console.log(ents.length, ents_a.length);