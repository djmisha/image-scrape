const fs = require("fs");
var https = require("https");
const array = require("./array.js");

/**
 * This script extracts images from the EDM train website by using
 * the events array and downloading each file.  The pattern used by EDMtrains is the artists
 * name with special characters.
 *
 * Todo:
 * - make API call to EDM Train, instead of having a manual array file
 * - set timeout between each download so that it doesn't do it all at once
 * - add if image is not available to skip it (500 error)
 */

// func to Replace characters in artist name string
const stringCleanup = (string) => {
  const cleanString = string
    .split("(")
    .join("%28")
    .split(")")
    .join("%29")
    .split("'")
    .join("&#39")
    .split("&")
    .join("&#38")
    .split("/")
    .join("&#47")
    .split(" ")
    .join("%20");
  return cleanString;
};

// func to extract artists names from events Array
const getArtists = () => {
  const allArtists = [];

  array.map((event) => {
    event.artistList &&
      event.artistList.map((artist) => {
        const { name } = artist;
        const cleanName = stringCleanup(name);
        allArtists.push(cleanName);
      });
  });

  return allArtists;
};

const artists = getArtists();

// func tp download files
var downloadFile = function (url, dest) {
  var file = fs.createWriteStream(dest);
  https.get(url, function (response) {
    response.pipe(file);
    file.on("finish", function () {
      file.close();
      console.log("Downloaded:", dest);
    });
  });
};

// func to iterate array and call download on each file
const getAllFiles = (array) => {
  const url = "https://d2po6uops3e7id.cloudfront.net/img/artist/"; // EDM TRAIN IMAGE Hosting URL

  array.map((item) => {
    let fullURL = `${url}${item}.jpg`;
    let fileName = `${item}.jpg`;
    downloadFile(fullURL, fileName);
  });
};

getAllFiles(artists);
