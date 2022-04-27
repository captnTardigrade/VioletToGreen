import * as vscode from "vscode";
const fs = require("fs");
const path = require("path");
import { SidebarSelectionProvider } from "./SidebarSelectionProvider";
import { SidebarReadabilityProvider } from "./SidebarReadabilityProvider";
import { SidebarLinksProvider } from "./SidebarLinksProvider";
import { runHeuristics } from "./heuristics";
import suggestComments from "./suggestComments";

// creates the config file if it doesn't exist
const createFile = () => {
  var workspace = vscode.workspace?.workspaceFolders;
  // if there is no workspace, do not run the extension
  if (workspace === null || workspace === undefined) {
    vscode.window.showErrorMessage("No workspace found");
    return false;
  }
  // creating the config file
  var filepath = path.join(
    workspace[0].uri.fsPath,
    "violettogreen.config.json"
  );
  fs.open(filepath, "r", (fileNotExists: Boolean, file: any) => {
    if (fileNotExists) {
      fs.writeFile(filepath, JSON.stringify([]), (err: any) => {
        if (err) {
          vscode.window.showErrorMessage(err);
          return false;
        }
      });
    }
  });
  return true;
};

// function that activates the extension
export function activate(context: vscode.ExtensionContext) {
  if (!createFile()) {
    return;
  }

  // creating a links webview panel
  const sidebarLinksProvider = new SidebarLinksProvider(context.extensionUri);
  // creating a selection webview panel
  const sidebarSelectionProvider = new SidebarSelectionProvider(
    context.extensionUri,
    sidebarLinksProvider
  );
  // creating a readability metrics webview panel
  const sidebarReadabilityProvider = new SidebarReadabilityProvider(
    context.extensionUri
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "violet-to-green-selection",
      sidebarSelectionProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "violet-to-green-readability",
      sidebarReadabilityProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "violet-to-green-links",
      sidebarLinksProvider
    )
  );

  // open the webview on startup
  vscode.commands.executeCommand(
    "workbench.view.extension.violet-to-green-sidebar-view"
  );

  /*
   * command to refresh the webview
   * (for development purposes)
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("violet-to-green.refresh", async () => {
      await vscode.commands.executeCommand("workbench.action.closeSidebar");
      await vscode.commands.executeCommand(
        "workbench.view.extension.violet-to-green-sidebar-view"
      );
    })
  );

  // command to run the heuristics and link code and comments
  vscode.commands.registerCommand("violet-to-green.linkAutomatically", () => {
    const editor = vscode.window.activeTextEditor;
    const javaText = editor?.document.getText();

    const workspace = vscode.workspace?.workspaceFolders;
    var filepath = path.join(
      workspace![0].uri.fsPath,
      "violettogreen.config.json"
    );
    // the path to the config file
    const root = workspace![0].uri.fsPath;

    // obtaining the automatically generated links
    const autoLinks = runHeuristics(
      javaText!,
      path.relative(root, vscode.window.activeTextEditor?.document.fileName)
    );
    var manualLinks: any[] = [];

    fs.readFile(filepath, "utf-8", function (err: any, content: any) {
      if (err) {
        vscode.window.showErrorMessage(err);
        return;
      }
      const json = JSON.parse(content);

      // add manually generated links to the automatically generated links
      for (var i = 0; i < json.length; i++) {
        if (json[i][0].type === "manual") {
          manualLinks.push(json[i]);
        }
      }
      var finalLinks = manualLinks.concat(autoLinks);

      // update the config file with the new links
      fs.writeFile(filepath, JSON.stringify(finalLinks), function (err: any) {
        if (err) {
          vscode.window.showErrorMessage(err);
          return;
        }
        sidebarLinksProvider._view?.webview.postMessage({
          type: "configLinks",
          value: finalLinks,
        });
      });
    });
  });

  // command to execute comment insertion suggestions
  vscode.commands.registerCommand(
    "violet-to-green.suggestComments",
    async () => {
      const editor = vscode.window.activeTextEditor;

      // getting the content of the open file
      const javaText = editor?.document.getText();
      var workspace = vscode.workspace?.workspaceFolders;
      if (workspace === null || workspace === undefined) {
        vscode.window.showErrorMessage("No workspace found");
        return;
      }
      var filepath = path.join(
        workspace[0].uri.fsPath,
        "violettogreen.config.json"
      );
      // the path to the config file
      const root = vscode.workspace?.workspaceFolders![0].uri.fsPath;

      // obtaining the grasp scores and their code blocks
      const result = await suggestComments(
        javaText!,
        path.relative(root, editor?.document.uri.fsPath!),
        path.relative(root, filepath!),
        root,
        vscode.window.activeTextEditor?.document.fileName!
      );

      // updating the UI with the grasp scores
      sidebarReadabilityProvider._view?.webview.postMessage({
        type: "commentSuggestions",
        value: result,
      });
    }
  );
}

export function deactivate() {}
