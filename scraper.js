'use strict';

var http = require("http");
var fs = require("fs");
var os = require("os");
var util = require("./util");

var EventEmitter = require('events');
var emitter = new EventEmitter();

var linksFound = 0;
var csvTemp = [`"Title","Price","ImageURL","URL","Time"${os.EOL}`];
var linkExpression = /<a href="(shirt\.php\?id=[\d]{1,4})">/gi;
var detailsExpression = /<img src="([\/a-z0-9\-\.]+)" alt="[\w\d\s,]+">[\s+<\/\w+=\-">]+(\$[\d\.]+)<\/[\w]+>([\w\d\s,]+)/gi;

var mikeDaFrog = {
  "hostname": "www.shirts4mike.com",
  "port": 80,
  "path": "/",
  "method": "GET",
  "headers": {
    "Content-Type": "text/html"
  }
};


var scrapeSite = function(options, emit) {
  var request = http.request(options, function(response) {
    if(response.statusCode == 200) {
      var body = "";
      response.on("data", function(data) { body += data; });
      response.on("end", function() { emitter.emit(emit, body); });
    } else {
      util.responseError(response);
    }
  });
  request.on("error", util.requestError).end();
};


var findLinks = function(body) {
  var matchArray;
  var links = [];
  var reLink = new RegExp(linkExpression);
  while((matchArray = reLink.exec(body)) !== null) {
    links.push(matchArray[1]);
  }
  emitter.emit("links_found", links);
};


var scrapeSites = function(links) {
  linksFound = links.length;
  links.map(function(link) {
    var frogCopy = JSON.parse(JSON.stringify(mikeDaFrog));
    frogCopy.path = "/" + link;
    emitter.emit("begin_second_scrape", frogCopy, "a_second_scrape_finished");
  });
};


var formatData = function(body) {
  var reDetails = new RegExp(detailsExpression);

  var data = reDetails.exec(body).slice(1);
  data.push(mikeDaFrog.hostname + data[0]);
  var fieldArray = [data[2], data[1], data[3], data[0], new Date().toString()];

  var csvField = fieldArray.map(function(value, index) {
    var test = (index == fieldArray.length - 1);
    var delimiter = test ? os.EOL : ",";
    return '"' + value.toLowerCase().trim() + '"' + delimiter;
  }).join('');

  csvTemp.push(csvField);
  emitter.emit("data_found");
};


var checkDataComplete = function() {
  if(linksFound == csvTemp.length - 1) {
    var csvArray = csvTemp.slice(0);
    emitter.emit("data_complete", csvArray);
  }
};


var saveCSV = function(csvArray) {
  var csv = csvArray.join('');
  var dataDir = util.getDir("./data");

  if(dataDir.isDirectory()){
    var d = new Date();
    var filename = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.csv`;
    fs.writeFile(`./data/${filename}`, csv, (err) => {
      if (err) throw err;
      console.log(`./data/${filename} saved!`);
    });
  }
};


/*
 * Events in order
 *
 */
emitter.on("start_first_scrape", scrapeSite);
emitter.on("first_scrape_done", findLinks);
emitter.on("links_found", scrapeSites);
emitter.on("begin_second_scrape", scrapeSite);
emitter.on("a_second_scrape_finished", formatData);
emitter.on("data_found", checkDataComplete);
emitter.on("data_complete", saveCSV);


/* Starts program */
emitter.emit("start_first_scrape", mikeDaFrog, "first_scrape_done");
