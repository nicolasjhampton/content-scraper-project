var http = require("http");
var fs = require("fs");


var responseError = function(response) {
  console.log(`Response error: ${response.statusCode}
               ${options.hostname}
               ${http.STATUS_CODES[response.statusCode]}`);
};


var requestError = function(err) {
  console.log(`Request error: ${err.code}
               ${err.hostname}
               ${err.message}`);
};


var getDir = function(dirpath) {
  try {
    var directory = fs.lstatSync(dirpath);
  } catch (err) {
    fs.mkdirSync(dirpath);
    var directory = fs.lstatSync(dirpath);
  }
  return directory;
}


module.exports.responseError = responseError;
module.exports.requestError = requestError;
module.exports.getDir = getDir;
