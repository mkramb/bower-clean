#!/usr/bin/env node

'use strict';

var clean = require('../index.js');
var opts = require('nomnom')
  .option('dryRun', {
    help: 'Only output what will be removed',
    flag: true
  })
  .parse();

try {
  clean(opts.dryRun);
}
catch(err) {
  console.error(err.toString());
}
