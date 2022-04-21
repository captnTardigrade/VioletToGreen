import * as vscode from "vscode";
const fs = require("fs");
const path = require("path");
import { SidebarSelectionProvider } from "./SidebarSelectionProvider";
import { SidebarReadabilityProvider } from "./SidebarReadabilityProvider";
import { SidebarLinksProvider } from "./SidebarLinksProvider";
import { runHeuristics } from "./heuristics";
import suggestComments from "./suggestComments";
// import suggestComments from "./suggestComments";

const createFile = () => {
  var workspace = vscode.workspace?.workspaceFolders;
  if (workspace === null || workspace === undefined) {
    vscode.window.showErrorMessage("No workspace found");
    return false;
  }
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

function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  if (document) {
    collection.set(document.uri, [
      {
        code: "",
        message: "This is a test for displaying diagnostic messages",
        range: new vscode.Range(
          new vscode.Position(3, 4),
          new vscode.Position(3, 10)
        ),
        severity: vscode.DiagnosticSeverity.Information,
        source: "",
        relatedInformation: [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(
              document.uri,
              new vscode.Range(
                new vscode.Position(1, 8),
                new vscode.Position(1, 9)
              )
            ),
            "Additional information about the diagnostic"
          ),
        ],
      },
    ]);
  } else {
    collection.clear();
  }
}

export function activate(context: vscode.ExtensionContext) {
  if (!createFile()) {
    return;
  }

  // const decoration = vscode.window.createTextEditorDecorationType({
  //   gutterIconPath: vscode.Uri.joinPath(
  //     context.extensionUri,
  //     "media",
  //     "checklist.svg"
  //   ).path,
  // });

  // const editor = vscode.window.activeTextEditor;

  // editor?.setDecorations(decoration, [
  //   new vscode.Range(new vscode.Position(1, 1), new vscode.Position(2, 4)),
  // ]);

  const collection = vscode.languages.createDiagnosticCollection("test");
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document, collection);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateDiagnostics(editor.document, collection);
      }
    })
  );

  const sidebarLinksProvider = new SidebarLinksProvider(context.extensionUri);
  const sidebarSelectionProvider = new SidebarSelectionProvider(
    context.extensionUri,
    sidebarLinksProvider
  );
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

  vscode.commands.executeCommand(
    "workbench.view.extension.violet-to-green-sidebar-view"
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("violet-to-green.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from VioletToGreen!");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("violet-to-green.refresh", async () => {
      await vscode.commands.executeCommand("workbench.action.closeSidebar");
      await vscode.commands.executeCommand(
        "workbench.view.extension.violet-to-green-sidebar-view"
      );
    })
  );

  vscode.commands.registerCommand("violet-to-green.linkAutomatically", () => {
    const editor = vscode.window.activeTextEditor;
    const javaText = editor?.document.getText();
    // const filesPath = path.resolve(
    //   __dirname,
    //   "..",
    //   "Dataset",
    //   "RealWorldData",
    //   "CodeFiles"
    // );
    // const outputPath = path.join(
    //   __dirname,
    //   "..",
    //   "Dataset",
    //   "RealWorldData",
    //   "Predictions"
    // );
    // // var filesLimit = 1;
    // var predictions: string;

    // fs.readdirSync(filesPath).forEach(function (filename: string) {
    //   fs.readFile(
    //     path.join(filesPath, filename),
    //     "utf-8",
    //     function (err: any, content: any) {
    //       if (err) {
    //         vscode.window.showErrorMessage(err);
    //         return;
    //       }
    //       predictions = runHeuristics(content, "");
    //       fs.writeFile(
    //         path.join(outputPath, filename.split(".")[0] + ".txt"),
    //         predictions,
    //         (err: any) => {
    //           vscode.window.showErrorMessage(err);
    //         }
    //       );
    //     }
    //   );
    // });

    const workspace = vscode.workspace?.workspaceFolders;
    var filepath = path.join(
      workspace![0].uri.fsPath,
      "violettogreen.config.json"
    );
    const root = workspace![0].uri.fsPath;
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

      for (var i = 0; i < json.length; i++) {
        if (json[i][0].type === "manual") {
          manualLinks.push(json[i]);
        }
      }
      var finalLinks = manualLinks.concat(autoLinks);

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

  vscode.commands.registerCommand(
    "violet-to-green.suggestComments",
    async () => {
      const editor = vscode.window.activeTextEditor;

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
      const root = vscode.workspace?.workspaceFolders![0].uri.fsPath;
      await suggestComments(
        javaText!,
        path.relative(root, editor?.document.uri.fsPath!),
        path.relative(root, filepath!),
        root
      );
    }
  );
}

export function deactivate() {}
