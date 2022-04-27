import * as vscode from "vscode";
const path = require("path");
const fs = require("fs");
import { getNonce } from "./getNonce";

export class SidebarLinksProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // filepath of the config file
    const filepath = path.join(
      vscode.workspace?.workspaceFolders![0].uri.fsPath,
      "violettogreen.config.json"
    );

    const root = vscode.workspace?.workspaceFolders![0].uri.fsPath;

    // utility function to set editor highlight decorations
    const decorate = (selection: any, decorationType: any, editor: any) => {
      const range = new vscode.Range(
        selection.startLine - 1,
        selection.startCharacter,
        selection.endLine - 1,
        selection.endCharacter
      );
      editor.setDecorations(decorationType, [range]);
    };

    var decorationType: any = [];

    // utility function to create editor highlight decorations based on type
    function createDecoration(type: Number) {
      decorationType.push(
        vscode.window.createTextEditorDecorationType({
          backgroundColor:
            type === 0 ? "rgb(26, 204, 44, 0.24)" : "	rgb(146, 54, 238, 0.08)",
          isWholeLine: false,
          rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        })
      );
    }

    var arrayRange: any = [];
    var codeChanges: any = [];
    var commentChanges: any = [];

    // runs when the cursor position is changed
    vscode.window.onDidChangeTextEditorSelection((e) => {
      // getting the position of the cursor
      var cursor = vscode.window.activeTextEditor?.selection.active;
      while (decorationType.length > 0) {
        decorationType[decorationType.length - 1].dispose();
        decorationType.pop();
      }

      // creating highlights based on the cursor position
      arrayRange.forEach((range: any) => {
        if (
          (cursor?.line! + 1 > range[0].startLine &&
            cursor?.line! + 1 < range[0].endLine) ||
          (cursor?.line! + 1 > range[1].startLine &&
            cursor?.line! + 1 < range[1].endLine) ||
          (cursor?.line! + 1 === range[0].startLine &&
            cursor?.character! >= range[0].startCharacter) ||
          (cursor?.line! + 1 === range[0].endLine &&
            cursor?.character! <= range[0].endCharacter) ||
          (cursor?.line! + 1 === range[1].startLine &&
            cursor?.character! >= range[1].startCharacter) ||
          (cursor?.line! + 1 === range[1].endLine &&
            cursor?.character! <= range[1].endCharacter)
        ) {
          // comparing the filepath of the currently open file
          const filepath = path.relative(
            root,
            vscode.window.activeTextEditor?.document.fileName
          );
          if (filepath === range[0].filepath) {
            createDecoration(0);
            decorate(
              range[0],
              decorationType[decorationType.length - 1],
              vscode.window.activeTextEditor
            );
          }
          if (filepath === range[1].filepath) {
            createDecoration(1);
            decorate(
              range[1],
              decorationType[decorationType.length - 1],
              vscode.window.activeTextEditor
            );
          }
        }
      });
    });

    // runs when the open file is saved
    vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
      const file = vscode.window.activeTextEditor?.document.fileName;
      // updating the links and saving them to the config file
      for (var i = 0; i < arrayRange.length; i++) {
        if (
          path.resolve(arrayRange[i][0].filepath) === path.resolve(file) ||
          path.resolve(arrayRange[i][1].filepath) === path.resolve(file)
        ) {
          const editor = vscode.window.activeTextEditor;
          for (var i = 0; i < arrayRange.length; i++) {
            for (var j = 0; j < arrayRange[i].length; j++) {
              if (
                path.resolve(arrayRange[i][j].filepath) === path.resolve(file)
              ) {
                const pos1 = new vscode.Position(
                  arrayRange[i][j].startLine - 1,
                  arrayRange[i][j].startCharacter
                );
                const pos2 = new vscode.Position(
                  arrayRange[i][j].endLine - 1,
                  arrayRange[i][j].endCharacter
                );
                const selectionString = editor?.document.getText(
                  new vscode.Selection(pos1, pos2)
                );
                arrayRange[i][j].string = selectionString;
              }
            }
          }
          fs.writeFile(filepath, JSON.stringify(arrayRange), (err: any) => {
            if (err) {
              vscode.window.showErrorMessage(err);
              return;
            }
            this._view?.webview.postMessage({
              type: "configLinks",
              value: arrayRange,
            });
          });
          return;
        }
      }

      // generating warnings if the comment has not been updated
      // after updating the code
      // codeChanges = [...new Set(codeChanges)];

      console.log(codeChanges);
      for (var i = 0; i < codeChanges.length; i++) {
        if (commentChanges.includes(codeChanges[i])) {
          codeChanges.splice(i, 1);
        }
      }
      console.log(codeChanges);

      var string = "";
      for (var i = 0; i < codeChanges.length; i++) {
        string =
          "Code changes detected in lines " +
          arrayRange[codeChanges[i]][1].startLine +
          " and " +
          arrayRange[codeChanges[i]][1].endLine +
          " in file " +
          arrayRange[codeChanges[i]][1].filepath +
          ". Please consider updating the corresponding comment";
        vscode.window.showWarningMessage(string);
      }
      codeChanges = [];
      commentChanges = [];
    });

    // when the open file is changed
    vscode.workspace.onDidChangeTextDocument((event) => {
      var cursor = vscode.window.activeTextEditor?.selection.active;
      const filepath = path.relative(
        root,
        vscode.window.activeTextEditor?.document.fileName
      );

      /*
       * if there is a new line inserted in any of the linked regions
       * then the corresponding code segment highlight region is updated
       * along with the ones below it
       */
      if (event.contentChanges[0].text.match(/\n/g) !== null) {
        for (var i = 0; i < arrayRange.length; i++) {
          if (
            cursor?.line! + 1 < arrayRange[i][1].startLine &&
            path.resolve(arrayRange[i][1].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][1].startLine += 1;
            arrayRange[i][1].endLine += 1;
          } else if (
            cursor?.line! + 1 >= arrayRange[i][1].startLine &&
            cursor?.line! + 1 <= arrayRange[i][1].endLine &&
            path.resolve(arrayRange[i][1].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][1].endLine += 1;
          }
          if (
            cursor?.line! + 1 < arrayRange[i][0].startLine &&
            path.resolve(arrayRange[i][0].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][0].startLine += 1;
            arrayRange[i][0].endLine += 1;
          } else if (
            cursor?.line! + 1 >= arrayRange[i][0].startLine &&
            cursor?.line! + 1 <= arrayRange[i][0].endLine &&
            path.resolve(arrayRange[i][0].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][0].endLine += 1;
          }
        }
      } else if (
        event.contentChanges[0].text === "" &&
        event.contentChanges[0].range.end.line ===
          event.contentChanges[0].range.start.line + 1
      ) {
        for (var i = 0; i < arrayRange.length; i++) {
          if (
            cursor?.line! + 1 < arrayRange[i][1].startLine &&
            path.resolve(arrayRange[i][1].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][1].startLine -= 1;
            arrayRange[i][1].endLine -= 1;
          } else if (
            cursor?.line! + 1 >= arrayRange[i][1].startLine &&
            cursor?.line! + 1 <= arrayRange[i][1].endLine &&
            path.resolve(arrayRange[i][1].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][1].endLine -= 1;
          }
          if (
            cursor?.line! + 1 < arrayRange[i][0].startLine &&
            path.resolve(arrayRange[i][0].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][0].startLine -= 1;
            arrayRange[i][0].endLine -= 1;
          } else if (
            cursor?.line! + 1 >= arrayRange[i][0].startLine &&
            cursor?.line! + 1 <= arrayRange[i][0].endLine &&
            path.resolve(arrayRange[i][0].filepath) === path.resolve(filepath)
          ) {
            arrayRange[i][0].endLine -= 1;
          }
        }
      }

      // checking if the a code segment or a comment segment is updated
      if (
        event.contentChanges[0] !== undefined &&
        event.contentChanges[0] !== null
      ) {
        for (var i = 0; i < arrayRange.length; i++) {
          if (
            cursor?.line! + 1 >= arrayRange[i][1].startLine &&
            cursor?.line! + 1 <= arrayRange[i][1].endLine
          ) {
            if (!codeChanges.includes(i)) {
              codeChanges.push(i);
            }
          }
          if (
            cursor?.line! + 1 >= arrayRange[i][0].startLine &&
            cursor?.line! + 1 <= arrayRange[i][0].endLine
          ) {
            if (!commentChanges.includes(i)) {
              commentChanges.push(i);
            }
          }
        }
      }
    });

    // for communication with the UI
    webviewView.webview.onDidReceiveMessage((data: any) => {
      switch (data.type) {
        case "info": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "error": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        // update the links for temporary persistence
        case "requestForConfigLinks": {
          var links;

          fs.readFile(filepath, (err: any, fileData: any) => {
            links = JSON.parse(fileData);
            if (err) {
              vscode.window.showErrorMessage(err);
            }
            arrayRange = links;
            this._view?.webview.postMessage({
              type: "configLinks",
              value: links,
            });
          });
          break;
        }
        // update the links for permanent persistence
        case "updateConfigLinks": {
          arrayRange = data.value;
          fs.writeFile(filepath, JSON.stringify(data.value), (err: any) => {
            if (err) {
              vscode.window.showErrorMessage(err);
              return false;
            }
          });
          break;
        }
        // update the links without persistence
        case "updateArrayRange": {
          arrayRange = data.value;
          break;
        }
        // open the relevant file for highlight and navigate to the relevant line
        case "gotoLine": {
          var openFile = vscode.Uri.file(
            path.resolve(root, data.value.filepath)
          );
          vscode.workspace.openTextDocument(openFile).then((doc) => {
            vscode.window
              .showTextDocument(
                doc,
                data.value.type === 1
                  ? { viewColumn: vscode.ViewColumn.Two }
                  : { viewColumn: vscode.ViewColumn.One }
              )
              .then(() => {
                let editor = vscode.window.activeTextEditor;
                let rangeStart = editor?.document.lineAt(
                  parseInt(data.value.startLine)
                ).range;
                const pos1 = new vscode.Position(
                  data.value.startLine,
                  data.value.startCharacter
                );
                const pos2 = new vscode.Position(
                  data.value.endLine,
                  data.value.endCharacter
                );
                // create a selection
                editor!.selection = new vscode.Selection(pos1, pos2);
                editor?.revealRange(rangeStart!);
              });
          });
          break;
        }
        // save links to the config file
        case "saveLinks": {
          const editor = vscode.window.activeTextEditor;
          const file = editor?.document.fileName;
          for (var i = 0; i < arrayRange.length; i++) {
            for (var j = 0; j < arrayRange[i].length; j++) {
              if (
                path.resolve(arrayRange[i][j].filepath) === path.resolve(file)
              ) {
                const pos1 = new vscode.Position(
                  arrayRange[i][j].startLine,
                  arrayRange[i][j].startCharacter
                );
                const pos2 = new vscode.Position(
                  arrayRange[i][j].endLine,
                  arrayRange[i][j].endCharacter
                );
                const selectionString = editor?.document.getText(
                  new vscode.Selection(pos1, pos2)
                );
                arrayRange[i][j].string = selectionString;
              }
            }
          }
          fs.writeFile(filepath, JSON.stringify(arrayRange), (err: any) => {
            if (err) {
              vscode.window.showErrorMessage(err);
              return;
            }
          });
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebarLinks.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "compiled/sidebarLinks.css"
      )
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
        </script>
			</head>
      <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
