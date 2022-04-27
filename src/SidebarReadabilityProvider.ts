import * as vscode from "vscode";
import { getNonce } from "./getNonce";

export class SidebarReadabilityProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const collection = vscode.languages.createDiagnosticCollection("test");

    // to create a diagnostic message
    function updateDiagnostics(
      document: vscode.TextDocument,
      collection: vscode.DiagnosticCollection,
      list: any
    ): void {
      if (document) {
        collection.set(document.uri, list);
      } else {
        collection.clear();
      }
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // for commumication with the UI
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
        // navigate to the file and to the relevant line
        case "gotoLine": {
          var openFile = data.value.filepath;
          vscode.workspace.openTextDocument(openFile).then((doc) => {
            vscode.window
              .showTextDocument(doc, { viewColumn: vscode.ViewColumn.One })
              .then(() => {
                let editor = vscode.window.activeTextEditor;
                let rangeStart = editor?.document.lineAt(
                  parseInt(data.value.startLine)
                ).range;
                const pos1 = new vscode.Position(
                  data.value.startLine,
                  Math.max(0, data.value.startCharacter - 1)
                );
                const pos2 = new vscode.Position(
                  data.value.endLine,
                  data.value.endCharacter
                );
                editor!.selection = new vscode.Selection(pos1, pos2);
                editor?.revealRange(rangeStart!);
              });
          });
          break;
        }
        // update the diagnostics and add information squiggles
        case "addSquiggles": {
          collection.clear();
          if (vscode.window.activeTextEditor) {
            const filename = vscode.window.activeTextEditor.document.fileName;
            var list: any = [];

            data.value.range.forEach((e: any, index: any) => {
              if (filename === data.value.filepath) {
                list.push({
                  code: "",
                  message: `Code has low grasp score of ${data.value.scores[index]}. We suggest inserting comments to improve comprehensibility.`,
                  range: new vscode.Range(
                    new vscode.Position(e.startLine - 1, e.startColumn - 1),
                    new vscode.Position(e.endLine - 1, e.endColumn)
                  ),
                  severity: vscode.DiagnosticSeverity.Information,
                  source: "",
                  relatedInformation: [],
                });
              }
            });

            // creating the hoverbox and squiggles
            if (filename === data.value.filepath) {
              updateDiagnostics(
                vscode.window.activeTextEditor!.document,
                collection,
                list
              );
            }
            break;
          }
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
        "compiled/sidebarReadability.js"
      )
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "compiled/sidebarReadability.css"
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
