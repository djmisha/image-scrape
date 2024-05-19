const fs = require("fs");
const path = require("path");
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
 * - make API call to SDHM/api/allevents (cahced route), instead of having a manual array file
 * - sort array alphabetically - what for?
 * - keep track of success and errored files and log out at the end of process
 * - keep track of success so that you don't run them again
 * - keep track of errors and save so that you can rerun at some point
 */

// func to remove duplicate items from an array
const removeDuplicates = (array) => {
  return array.filter((a, b) => array.indexOf(a) === b);
};

// func to Replace characters in artist name string
const stringClean = (string) => {
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

// reverse clean string for fileName
const stringDirty = (string) => {
  const dirtyString = string
    .split("%28")
    .join("(")
    .split("%29")
    .join(")")
    .split("&#39")
    .join("'")
    .split("&#47")
    .join("/")
    .split("%20")
    .join(" ");

  return dirtyString;
};

// func to extract all artists names from events Array
const getArtists = (array) => {
  const allArtists = [];

  array.map((event) => {
    event.artistList &&
      event.artistList.map((artist) => {
        const { name } = artist;
        const cleanName = stringClean(name);
        allArtists.push(cleanName);
      });
  });

  const cleanArtists = removeDuplicates(allArtists);

  return cleanArtists;
};

// Function to read the successImages.json file and return the array of filenames
function getSuccessfulDownloads() {
  const successFilePath = path.join(__dirname, "successImages.json");
  if (fs.existsSync(successFilePath)) {
    const data = fs.readFileSync(successFilePath);
    return JSON.parse(data);
  }
  return [];
}

// Function to append a filename to the successImages.json file
function logSuccessfulDownload(filename) {
  const successFilePath = path.join(__dirname, "successImages.json");
  const successfulDownloads = getSuccessfulDownloads();
  successfulDownloads.push(filename);
  fs.writeFileSync(successFilePath, JSON.stringify(successfulDownloads));
}

// Function to append a filename to the failedImages.json file
function logFailedDownload(filename) {
  const failedFilePath = path.join(__dirname, "failedImages.json");
  let failedDownloads = [];
  if (fs.existsSync(failedFilePath)) {
    const data = fs.readFileSync(failedFilePath);
    failedDownloads = JSON.parse(data);
  }
  failedDownloads.push(filename);
  fs.writeFileSync(failedFilePath, JSON.stringify(failedDownloads));
}

// Updated downloadFile function
async function downloadFile(fileUrl, filename, index) {
  const successfulDownloads = getSuccessfulDownloads();

  // If the file has already been successfully downloaded, skip the download
  if (successfulDownloads.includes(filename)) {
    console.log(
      `File ${filename} has already been downloaded. Skipping download.`
    );
    return;
  }

  const outputLocationPath = path.join(
    __dirname,
    "images",
    stringDirty(filename)
  );

  https.get(fileUrl, function (response) {
    if (response.statusCode === 200) {
      const file = fs.createWriteStream(outputLocationPath);
      response.pipe(file);
      file.on("finish", function () {
        file.close();
        console.info(`#${index} Success:`, filename);
        // After a successful download, log locally
        logSuccessfulDownload(filename);
      });
    }

    // If the file is not found or forbidden, log the error and save the filename
    if (response.statusCode === 403 || response.statusCode === 500) {
      console.info(`#${index} Error:`, filename);
      logFailedDownload(filename);
    }
  });
}
// func to iterate array and call download on each file
const getAllFiles = (array) => {
  const url = "https://d2po6uops3e7id.cloudfront.net/img/artist/"; // EDM TRAIN IMAGE Hosting URL

  // for (let i = 0; i < 5; i++) {
  // uncoment to run only 5 files
  for (let i = 0; i < array.length; i++) {
    setTimeout(() => {
      const item = array[i];
      const fullURL = `${url}${item}.jpg`;
      const fileName = `${item}.jpg`;

      downloadFile(fullURL, fileName, i);
    }, 10); // delays by .25 seconds
  }
};

// Call the functions to run the app

const artists = getArtists(events);

getAllFiles(artists);
