const fs = require("fs");
const https = require("https");
const events = require("./array.js");

/**
 * This script extracts images from the EDM train S3 bucked by using
 * the events array and downloading each file.
 *
 * The pattern used by EDMtrains is the artists
 * name with special characters.
 *
 * Todo:
 * - make API call to EDM Train, instead of having a manual array file
 * - sort array alphabetically
 * - keep track of success and errored files and log out at the end of process
 * - keep track of success so that you don't run them again
 * - keep track of errors and save so that you can rerun at some point
 */

// func to remove duplicate items from an array
const removeDuplicates = (array) => {
  return array.filter((a, b) => array.indexOf(a) === b);
};

// func to Replace characters in artist name string
const stringCleanup = (string) => {
  const cleanString = string
    .split("(")
    .join("%28")
    .split(")")
    .join("%29")
    .split("'")
    .join("&#39")
    .split("/")
    .join("&#47")
    .split(" ")
    .join("%20");

  return cleanString;
};

// func to extract all artists names from events Array
const getArtists = (array) => {
  const allArtists = [];

  array.map((event) => {
    event.artistList &&
      event.artistList.map((artist) => {
        const { name } = artist;
        const cleanName = stringCleanup(name);
        allArtists.push(cleanName);
      });
  });

  const cleanArtists = removeDuplicates(allArtists);

  return cleanArtists;
};

// func to download files
const downloadFile = function (url, fileName, index) {
  https.get(url, function (response) {
    if (response.statusCode === 200) {
      const file = fs.createWriteStream(`images/${fileName}`);
      response.pipe(file);
      file.on("finish", function () {
        file.close();
        console.info(`#${index} Success:`, fileName);
      });
    }

    if (response.statusCode === 403 || response.statusCode === 500) {
      console.info(`#${index} Error:`, fileName);
    }
  });
};

// func to iterate array and call download on each file
const getAllFiles = (array) => {
  const url = "https://d2po6uops3e7id.cloudfront.net/img/artist/"; // EDM TRAIN IMAGE Hosting URL

  for (let i = 0; i < array.length; i++) {
    setTimeout(() => {
      const item = array[i];
      const fullURL = `${url}${item}.jpg`;
      const fileName = `${item}.jpg`;

      downloadFile(fullURL, fileName, i);
    }, i * 1000);
  }
};

// Call the functions to run the app

const artists = getArtists(events);

getAllFiles(artists);
