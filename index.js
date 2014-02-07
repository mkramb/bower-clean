'use strict';

var _ = require('lodash');
var util = require('util');
var path = require('path');

var fs = require('fs');
var minimatch = require('minimatch');

var walk = require('walk');
var async = require('async');
var bower = require('bower');

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

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var whitelist = ['.bower.json', '.jshintrc'];

function whitelisted(path) {
  return !!_.find(whitelist, function (w) {
    return endsWith(path, "/" + w);
  });
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file,index) {
      var curPath = util.format('%s/%s', path, file);

      if (fs.statSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(path);
  }
}

module.exports = function(dryRun) {
  var basePath = process.cwd();
  var ignore = require(path.join(basePath, 'bower.json')).dependenciesIgnore;

  if (!ignore || _.isEmpty(ignore)) {
    throw 'No configuration provided';
  }

  bower.commands
    .list({}, { offline: true })
    .on('error', function (err) {
      console.error(err.message);
    })
    .on('end', function (list) {
      var dirs = extractComponentDirs(list);
      var whitelist = [".bower.json", ".jshintrc"];

      var results = {};
      var processed = {};

      async.each(
        _.keys(dirs),
        function(component, callback) {
          results[component] = [];

          var walker  = walk.walk(dirs[component], {
            followLinks: false
          });

          walker.on('directories', function (root, stats, next) {
            _.each(stats, function(stat) {
              results[component].push(
                util.format('%s/%s', root, stat.name)
              );
            });

            next();
          });

          walker.on('file', function(root, stat, next) {
            var path = util.format('%s/%s', root, stat.name);

            if (!whitelisted(path)) {
              results[component].push(path);
            }

            next();
          });

          walker.on('end', function() {
            processed[component] = results[component];

            _.each(ignore[component], function(item) {
              processed[component] = minimatch.match(
                processed[component], item, { dot: true }
              );
            });

            processed[component].reverse();
            callback();
          });
        },
        function() {
          var output = [];

          _.each(processed, function(files, component) {
            output.push(util.format("= %s\n", component));

            if (!files.length) {
              output.push("  /\n");
            }

            _.each(files, function(path) {
              output.push(util.format("  - %s\n", path));

              if (!dryRun) {
                if (fs.lstatSync(path).isDirectory()) {
                  deleteFolderRecursive(path);
                }
                else {
                  fs.unlinkSync(path);
                }
              }
            });

            output.push("\n");
          });

          process.stdout.write(output.join(''));
        }
      );
    });
};
