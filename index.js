'use strict';

var _ = require('lodash');
var util = require('util');
var path = require('path');
var fs = require('extfs');

var minimatch = require('minimatch');
var async = require('async');
var bower = require('bower');
var walk = require('walk');

function extractComponents(list) {
  var components = {};

  function callback(l) {
    _.each(l.dependencies, function (info, component) {
      if (info.canonicalDir) {
        components[component] = info.canonicalDir;
      }

      callback(info);
    });
  }

  callback(list);
  return components;
}

function isWhitelisted(path) {
  var whitelist = ['.bower.json', '.jshintrc'];

  return !!_.find(whitelist, function (w) {
    return endsWith(path, "/" + w);
  });
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function sortByLength(a, b) {
    a = a.toString().length;
    b = b.toString().length;

    return a < b ?
      1 : (a > b ? -1 : 0);
}

module.exports = function(dryRun) {
  var ignore = require(path.join(process.cwd(), 'bower.json')).dependenciesIgnore;

  if (!ignore || _.isEmpty(ignore)) {
    throw 'No configuration provided';
  }

  bower.commands
    .list({}, { offline: true })

    .on('error', function (err) {
      console.error(err.message);
    })

    .on('end', function (list) {
      var components = extractComponents(list);
      var processed = {};

      async.each(
        _.keys(components),
        function(component, callback) {
          processed[component] = {
            directories: [],
            files: []
          };

          var walker = walk.walk(components[component], {
            followLinks: false
          });

          walker.on('directories', function (root, stats, next) {
            _.each(stats, function(stat) {
              processed[component].directories.push(
                util.format('%s/%s', root, stat.name)
              );
            });

            next();
          });

          walker.on('file', function(root, stat, next) {
            var path = util.format('%s/%s', root, stat.name);

            if (!isWhitelisted(path)) {
              processed[component].files.push(path);
            }

            next();
          });

          walker.on('end', function() {
            if (ignore[component]) {
              _.each(ignore[component], function(item) {
                processed[component].files = minimatch.match(
                  processed[component].files, item, { dot: true }
                );
              });

              processed[component].files.sort(sortByLength);
              processed[component].directories.sort(sortByLength);
            }

            callback();
          });
        },
        function() {
          var output = [];

          _.each(processed, function(item, component) {
            var directories = item.directories;
            var files = item.files;

            output.push(util.format("= %s\n", component));

            _.each(files, function(path) {
              output.push(util.format("  - %s\n", path));

              if (!dryRun) {
                fs.removeSync(path);
              }
            });

            output.push("\n");

            _.each(directories, function(path) {
              if (fs.isEmptySync(path)) {
                fs.removeSync(path);
              }
            });
          });

          process.stdout.write(output.join(''));
        }
      );
    }
  );
};
