const cors = require("cors");
const dirTree = require("directory-tree");
const express = require("express");
var fs = require("fs");
var http = require("http");
const soundPlayer = require("play-sound")(opts = {});

const app = express();
const port = 3000;
const soundsRoot = "/Users/jteves/Downloads";

const path = require("path");

// Middleware
app.use(express.json());
app.use(cors());
// Set content type for all endpoints
// app.use((req, res, next) => {
//     res.contentType("application/json");
//     next();
// });

app.set("view engine", "html");
app.use("/", express.static(path.join(__dirname, 'public')));

// Default route (replace this)
// app.get("/", (req, res) => res.render(__dirname + '/public/index.html'));

// Get a tree of files/folders
app.get("/listing", (req, res) => res.json(pathInfo(soundsRoot).children));

// Play a sound
app.post("/play", (req, res) => {
    console.log(req.body);
    const file = soundsRoot + req.body.body.file;
    soundPlayer.play(file, function(err) {
        console.log("Could not find/play audio file: " + file + " - received error: " + err);
    });
    res.json(pathInfo(file));
});

// Download a sound from a supplied URL
app.post("/import", (req, res) => {
    // Extract the filename from the URL with some nasty ol regex
    const fileName = req.body.url.substring(
        req.body.url.lastIndexOf("/") + 1).replace(/((\?|#).*)?$/, ""),
        // Use the same file name for the destination
        dest = soundsRoot + req.body.path + "/" + fileName;
    download(req.body.url, dest, err => {
        if (err) {
            res.status(500).json({ "error": "Error - " + err });
        } else {
            res.json(pathInfo(dest));
        }
    });
});

function download(url, dest, callBack) {
    // Downloads a file to a destination
    const file = fs.createWriteStream(dest);
    http.get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => file.close(callBack));
    }).on("error", err => {
        // Delete the file
        fs.unlink(dest);
        if (callBack) callBack(err.message);
    });
};

function pathInfo(path) {
    // Returns a heirarchal listing of dirs/files
    return convertToRelativePath(
        dirTree(path, { extensions: /\.(wav|mp3|)$/i }));
}

function convertToRelativePath(tree) {
    // Adjust the paths to be relative to our sounds dir, instead of showing
    // the absolute path
    tree.path = tree.path.replace(soundsRoot, "");
    (tree.children || []).forEach(convertToRelativePath);
    return tree;
}

// Start server
app.listen(port, () => console.log(`Soundboard Server listening on port ${port}!`));
