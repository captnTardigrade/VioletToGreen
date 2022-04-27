import * as vscode from "vscode";
const path = require("path");
const fs = require("fs");
import { getNonce } from "./getNonce";
import { SidebarLinksProvider } from "./SidebarLinksProvider";

export class SidebarSelectionProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private _sidebarLinksProvider: SidebarLinksProvider
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    const filepath = path.join(
      vscode.workspace?.workspaceFolders![0].uri.fsPath,
      "violettogreen.config.json"
    );

    const root = vscode.workspace?.workspaceFolders![0].uri.fsPath;

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
        // sending the user selection to the UI
        case "requestSelection": {
          const editor = vscode.window.activeTextEditor;
          const selectionString = editor?.document.getText(editor.selection);
          this._view?.webview.postMessage({
            type: "responseSelection",
            value: {
              string: selectionString,
              startLine: editor?.selection.start.line,
              endLine: editor?.selection.end.line,
              startCharacter: Math.max(
                0,
                editor?.selection.start.character! - 1
              ),
              endCharacter: Math.max(0, editor?.selection.end.character! - 1),
              filepath: path.relative(
                root,
                vscode.window.activeTextEditor?.document.fileName
              ),
              type: "manual",
            },
          });
          break;
        }
        // sending the links to the UI
        case "requestForLinks": {
          this._sidebarLinksProvider._view?.webview.postMessage({
            type: "requestForLinks",
            value: "requestForLinks",
          });
          break;
        }
        // save the links and add new links to the config file
        case "addLink": {
          this._sidebarLinksProvider._view?.webview.postMessage({
            type: "saveLinks",
            value: "Save the links",
          });
          setTimeout(() => {
            fs.readFile(filepath, (err: any, fileData: any) => {
              var links = JSON.parse(fileData);
              links = [data.value, ...links];
              fs.writeFile(filepath, JSON.stringify(links), (err: any) => {
                if (err) {
                  vscode.window.showErrorMessage(err);
                  return;
                }
                this._sidebarLinksProvider._view?.webview.postMessage({
                  type: "configLinks",
                  value: links,
                });
              });
              if (err) {
                vscode.window.showErrorMessage(err);
              }
            });
          }, 1000);
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
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "compiled/sidebarSelection.js"
      )
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "compiled/sidebarSelection.css"
      )
    );

    // Use a nonce to only allow a specific script to be run.
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
