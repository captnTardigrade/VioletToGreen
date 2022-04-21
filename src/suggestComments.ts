// //import { runHeuristics } from "./heuristics";

import { config } from "process";
import axios from "axios";

const fs = require("fs");
const path = require("path");

async function suggestComments(
  javaText: string,
  uri: string,
  configPath: string,
  root: string
) {
  console.log("Hello from suggestComments");
  console.log("javatext", javaText);
  console.log("uri", uri);
  console.log("configOut", configPath);
  configPath = path.resolve(root, configPath);

  var lines: string;
  var configFile: any;
  var configOut: any[] = [];
  (async () => {
    lines = fs.readFileSync(configPath);
    configFile = JSON.parse(lines);
  })();
  //just read from config file
  console.log(configFile.length);
  for (let i = 0; i < configFile.length; i++) {
    //console.log (typeof configFile[i]);
    if (configFile[i][0]["filepath"] === uri) {
      var configOut: any[];
      configOut.push(configFile[i]);
    }
  }

  var payload = {
    code: javaText,
    configs: configOut,
  };
  console.log(payload);

  await axios
    .post("http://localhost:3000/suggest_comments", payload)
    .then((response) => {
      console.log(response);
    });

  return "nothing yet";
  //console.log(configFile);
  //links =
}

export default suggestComments;
