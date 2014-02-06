'use strict';

var _ = require('lodash');
var util = require('util');
var path = require('path');
var Q = require('q');

var bower = require('bower');
var removeIgnores = require('./lib/removeIgnores');

function extractComponentDirs(list) {
  var dirs = {};

  function d(l) {
    _.each(l.dependencies, function (info, component) {
      if (info.canonicalDir) {
        dirs[component] = info.canonicalDir;
      }

      d(info);
    });
  }

  d(list);
  return dirs;
}

module.exports = function(dryRun) {
  var basePath = process.cwd();
  var cfg = require(path.join(basePath, 'bower.json')).dependenciesIgnore;

  if (!cfg || _.isEmpty(cfg)) {
    throw 'No configuration provided';
  }

  bower.commands
    .list({}, {offline: true})
    .on('error', function (err) {
      console.error(err.message);
    })
    .on('end', function (list) {
      var dirs = extractComponentDirs(list);
      var removals = [];

      _.each(dirs, function(dir, component) {
        var ignore = cfg[component];
        if (ignore) {
          removals.push(removeIgnores(dir, ignore, {
            dryRun: dryRun
          }));
        }
      });

      Q.all(removals).then(function (dependencies) {
        _.each(dependencies, function(files) {
          _.each(files, function(file) {
            console.log(file);
          });
        });
      }, function (err) {
        throw err.message;
      });
    });
};
