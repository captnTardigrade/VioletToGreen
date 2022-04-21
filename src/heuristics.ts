import * as vscode from "vscode";
import { linkComments } from "./parser";
import { CodeSampler } from "./codeSampler";

export const runHeuristics = (javaText: string, uri: string) => {
  const parser = linkComments(javaText);
  const codeSampler = new CodeSampler();
  const editor = vscode.window.activeTextEditor;
  var links = [];
  var keywordsArray: string[] = [];

  codeSampler.getBlocks(javaText);

  const containsKeyword = (
    keywords: string[],
    comment: any,
    commentText: string,
    codeSamplerArray: any,
    nextNonEmpty: any
  ) => {
    for (const keyword of keywords) {
      if (commentText.includes(keyword)) {
        for (var i = 0; i < codeSamplerArray.length; i++) {
          if (codeSamplerArray[i].startLine === nextNonEmpty) {
            links.push([
              convertToObject(comment),
              convertToObject(codeSamplerArray[i]),
            ]);
            return true;
          }
        }
      }
    }
    return false;
  };

  const containsKeywordPrev = (
    keywords: string[],
    comment: any,
    commentText: string,
    codeSamplerArray: any,
    prevNonEmpty: any
  ) => {
    for (const keyword of keywords) {
      if (commentText.includes(keyword)) {
        for (var i = codeSamplerArray.length - 1; i >= 0; i--) {
          if (codeSamplerArray[i].endLine === prevNonEmpty) {
            links.push([
              convertToObject(comment),
              convertToObject(codeSamplerArray[i]),
            ]);
            return true;
          }
        }
      }
    }
    return false;
  };

  const notContainsKeyword = (
    nextNonEmpty: any,
    comment: any,
    codeSamplerArray: any
  ) => {
    for (var i = 0; i < codeSamplerArray.length; i++) {
      if (codeSamplerArray[i].startLine === nextNonEmpty) {
        links.push([
          convertToObject(comment),
          convertToObject(codeSamplerArray[i]),
        ]);
        return true;
      }
    }
    return false;
  };

  const notContainsKeywordInline = (comment: any, codeSamplerArray: any) => {
    for (var i = 0; i < codeSamplerArray.length; i++) {
      if (codeSamplerArray[i].startLine === comment.startLine) {
        links.push([
          convertToObject(comment),
          convertToObject(codeSamplerArray[i]),
        ]);
        return true;
      }
    }
    return false;
  };

  const containsKeywordInside = (
    keywords: any,
    comment: any,
    commentText: string,
    codeSamplerArray: any,
    prevNonEmpty: any
  ) => {
    for (const keyword of keywords) {
      if (commentText.includes(keyword)) {
        for (var i = 0; i < codeSamplerArray.length; i++) {
          if (codeSamplerArray[i].startLine === prevNonEmpty) {
            links.push([
              convertToObject(comment),
              convertToObject(codeSamplerArray[i]),
            ]);
            return true;
          }
        }
      }
    }
    return false;
  };

  const convertToObject = (value: any) => {
    return {
      startLine: value.startLine,
      startCharacter: value.startCharacter
        ? value.startCharacter
        : value.startColumn,
      endLine: value.endLine,
      endCharacter: value.endCharacter ? value.endCharacter : value.endColumn,
    };
  };

  findLinks: for (const comment of parser?.comments!) {
    var nextNonEmpty = -1;
    var prevNonEmpty = -1;
    for (var i = comment.endLine; i < parser?.lines.length!; i++) {
      if (parser!.lines[i].trim().length > 0) {
        nextNonEmpty = i + 1;
        break;
      }
    }
    for (var i = comment.startLine - 1; i > 1; i--) {
      if (parser!.lines[i - 2].trim().length > 0) {
        prevNonEmpty = i - 1;
        break;
      }
    }
    const pos1 = new vscode.Position(
      comment.startLine - 1,
      comment.startCharacter
    );
    const pos2 = new vscode.Position(comment.endLine - 1, comment.endCharacter);
    const commentText = editor?.document
      .getText(new vscode.Selection(pos1, pos2))
      .toLocaleLowerCase();

    // TODO!: Replace this by sending a request to the server and then
    // determining if the comment is a code snippet or not
    const isCode = Math.random() > 0.8;

    // if it is a multiline and single line comment
    if (
      (!isCode && comment.type === parser?.enums.multiline) ||
      comment.type === parser?.enums.singleLine
    ) {
      if (nextNonEmpty !== -1) {
        keywordsArray = ["class", "@author", "program"];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.classes,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }

        keywordsArray = ["interface", "@author"];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.interfaces,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }

        // if next line is function declaration
        keywordsArray = [
          "@param",
          "@return",
          "function",
          "method",
          "routine",
          "routines",
          "subroutine",
          "subroutines",
          "returns",
          "@throws",
          "@exception",
          "driver",
          "constructor",
          "destructor",
          "recurse",
          "recursive",
          "recursion",
          "create",
          "creating",
          "recursing",
        ];
        if (!commentText?.includes("above")) {
          if (
            containsKeyword(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.methods,
              nextNonEmpty
            )
          ) {
            continue findLinks;
          }
        } else {
          if (
            containsKeywordPrev(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.methods,
              prevNonEmpty
            )
          ) {
            continue findLinks;
          }
        }

        // if next line is @Override or @Deprecated, then its next line is a function
        if (
          parser.lines[nextNonEmpty - 1].trim() === "@Override" ||
          parser.lines[nextNonEmpty - 1].trim() === "@Deprecated"
        ) {
          var tempNextLine = nextNonEmpty + 1;
          for (var i = nextNonEmpty + 1; i < parser.lines.length; i++) {
            if (parser.lines[i].length > 0) {
              tempNextLine = i + 1;
              break;
            }
          }
          for (var i = 0; i < codeSampler.methods.length; i++) {
            if (codeSampler.methods[i].startLine === tempNextLine) {
              links.push([
                convertToObject(comment),
                convertToObject(codeSampler.methods[i]),
              ]);
              continue findLinks;
            }
          }
        }

        // if next line contains for or while loop
        keywordsArray = [
          "loop",
          "loops",
          "iteration",
          "iterations",
          "iterate",
          "iterates",
          "go through",
          "goes through",
          "fill",
          "until",
          "do",
        ];
        if (!commentText?.includes("above")) {
          if (
            containsKeyword(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.forLoops,
              nextNonEmpty
            )
          ) {
            continue findLinks;
          }
          if (
            containsKeyword(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.whileLoops,
              nextNonEmpty
            )
          ) {
            continue findLinks;
          }
          if (
            containsKeyword(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.doStatements,
              nextNonEmpty
            )
          ) {
            continue findLinks;
          }
        } else {
          if (
            containsKeywordPrev(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.forLoops,
              prevNonEmpty
            )
          ) {
            continue findLinks;
          }
          if (
            containsKeywordPrev(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.whileLoops,
              prevNonEmpty
            )
          ) {
            continue findLinks;
          }
          if (
            containsKeywordPrev(
              keywordsArray,
              comment,
              commentText!,
              codeSampler.doStatements,
              prevNonEmpty
            )
          ) {
            continue findLinks;
          }
        }

        // if next line contains switch statement
        keywordsArray = ["switch", "switching", "based on", "cases"];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.switchStatements,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }

        // if next line contains case statement
        keywordsArray = ["case", "default", "if"];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.caseBlocks,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }

        // if next line contains if, else if or else statements
        keywordsArray = [
          "else",
          "check",
          "checking",
          "whether",
          "else if",
          "elif",
          "if",
          "otherwise",
        ];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.ifElseStatements,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }

        // if the above condition is not satisfied
        // if next line is a class declaration
        if (notContainsKeyword(nextNonEmpty, comment, codeSampler.classes)) {
          continue findLinks;
        }

        // if next line is an interface declaration
        if (notContainsKeyword(nextNonEmpty, comment, codeSampler.interfaces)) {
          continue findLinks;
        }

        // first link it if the next line is a function
        if (!commentText?.includes("above")) {
          if (notContainsKeyword(nextNonEmpty, comment, codeSampler.methods)) {
            continue findLinks;
          }
        }

        // second link it if the next line is a loop statement
        if (!commentText?.includes("above")) {
          if (notContainsKeyword(nextNonEmpty, comment, codeSampler.forLoops)) {
            continue findLinks;
          }
          if (
            notContainsKeyword(nextNonEmpty, comment, codeSampler.whileLoops)
          ) {
            continue findLinks;
          }
          if (
            notContainsKeyword(nextNonEmpty, comment, codeSampler.doStatements)
          ) {
            continue findLinks;
          }
        }

        // third link it if the next line is a conditional statement
        if (
          notContainsKeyword(
            nextNonEmpty,
            comment,
            codeSampler.ifElseStatements
          )
        ) {
          continue findLinks;
        }
        if (notContainsKeyword(nextNonEmpty, comment, codeSampler.caseBlocks)) {
          continue findLinks;
        }
        // third link it if the next line is a conditional statement
        if (
          notContainsKeyword(
            nextNonEmpty,
            comment,
            codeSampler.switchStatements
          )
        ) {
          continue findLinks;
        }

        // fourth link it if the next line is a declaration or assignment statement
        if (
          notContainsKeyword(
            nextNonEmpty,
            comment,
            codeSampler.initAndDeclStatements
          )
        ) {
          continue findLinks;
        }
        if (
          notContainsKeyword(
            nextNonEmpty,
            comment,
            codeSampler.assignmentStatements
          )
        ) {
          continue findLinks;
        }

        // if the next line is a variable declaration
        keywordsArray = [
          "initialize",
          "variable",
          "value",
          "store",
          "stores",
          "declare",
          "declaring",
          "create",
          "creating",
        ];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.initAndDeclStatements,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }

        // if the next line is an assignment statement
        keywordsArray = [
          "assign",
          "set",
          "update",
          "increment",
          "decrement",
          "store",
          "stores",
        ];
        if (
          containsKeyword(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.assignmentStatements,
            nextNonEmpty
          )
        ) {
          continue findLinks;
        }
      } else if (prevNonEmpty !== -1) {
        // check if the comment is written inside a function body
        keywordsArray = [
          "@param",
          "@return",
          "function",
          "method",
          "routine",
          "routines",
          "subroutine",
          "subroutines",
          "returns",
          "@throws",
          "@exception",
          "driver",
          "constructor",
          "destructor",
          "recurse",
          "recursive",
          "recursion",
          "create",
          "creating",
          "recursing",
        ];
        if (
          containsKeywordInside(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.methods,
            prevNonEmpty
          )
        ) {
          continue findLinks;
        }

        // check if the comment is written inside a loop body
        keywordsArray = [
          "loop",
          "loops",
          "iteration",
          "iterations",
          "iterate",
          "iterates",
          "go through",
          "goes through",
          "fill",
          "until",
        ];
        if (
          containsKeywordInside(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.forLoops,
            prevNonEmpty
          ) ||
          containsKeywordInside(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.whileLoops,
            prevNonEmpty
          ) ||
          containsKeywordInside(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.doStatements,
            prevNonEmpty
          )
        ) {
          continue findLinks;
        }

        // check if the comment is written inside an if, elif or else body
        keywordsArray = [
          "else",
          "check",
          "checking",
          "whether",
          "else if",
          "elif",
          "if",
          "otherwise",
        ];
        if (
          containsKeywordInside(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.ifElseStatements,
            prevNonEmpty
          )
        ) {
          continue findLinks;
        }

        // check if the comment is written inside a case block
        keywordsArray = ["case", "default", "if"];
        if (
          containsKeywordInside(
            keywordsArray,
            comment,
            commentText!,
            codeSampler.caseBlocks,
            prevNonEmpty
          )
        ) {
          continue findLinks;
        }
      }
    } else {
      if (!commentText?.includes("above")) {
        // if the current line is a declaration statement
        if (
          notContainsKeywordInline(comment, codeSampler.initAndDeclStatements)
        ) {
          continue findLinks;
        }

        // if the current line is an assignment statement
        if (
          notContainsKeywordInline(comment, codeSampler.assignmentStatements)
        ) {
          continue findLinks;
        }

        // if the current line is an if, else if or else statement
        if (notContainsKeywordInline(comment, codeSampler.ifElseStatements)) {
          continue findLinks;
        }
      }
    }
  }
  // var annotations: string = "";
  // for (var i = 0; i < links.length; i++) {
  //   annotations +=
  //     links[i][0].startLine +
  //     "," +
  //     links[i][0].startCharacter +
  //     "," +
  //     links[i][0].endLine +
  //     "," +
  //     links[i][0].endCharacter +
  //     "," +
  //     links[i][1].startLine +
  //     "," +
  //     links[i][1].startCharacter +
  //     "," +
  //     links[i][1].endLine +
  //     "," +
  //     links[i][1].endCharacter +
  //     " ``\n";
  // }
  // return annotations;
  var autoLinks = [];
  var pos1, pos2, selectionString1, selectionString2;
  for (var i = 0; i < links.length; i++) {
    pos1 = new vscode.Position(
      links[i][0].startLine - 1,
      Math.max(links[i][0].startCharacter - 1, 0)
    );
    pos2 = new vscode.Position(
      links[i][0].endLine - 1,
      Math.max(links[i][0].endCharacter - 1, 0)
    );
    selectionString1 = editor?.document.getText(
      new vscode.Selection(pos1, pos2)
    );

    pos1 = new vscode.Position(
      links[i][1].startLine - 1,
      Math.max(links[i][1].startCharacter - 1, 0)
    );
    pos2 = new vscode.Position(
      links[i][1].endLine - 1,
      Math.max(links[i][1].endCharacter - 1, 0)
    );
    selectionString2 = editor?.document.getText(
      new vscode.Selection(pos1, pos2)
    );
    autoLinks.push([
      {
        startLine: links[i][0].startLine,
        startCharacter: Math.max(0, links[i][0].startCharacter - 1),
        endLine: links[i][0].endLine,
        endCharacter: Math.max(0, links[i][0].endCharacter - 1),
        filepath: uri,
        string: selectionString1,
        type: "auto",
      },
      {
        startLine: links[i][1].startLine,
        startCharacter: Math.max(0, links[i][1].startCharacter - 1),
        endLine: links[i][1].endLine,
        endCharacter: Math.max(0, links[i][1].endCharacter - 1),
        filepath: uri,
        string: selectionString2,
        type: "auto",
      },
    ]);
    console.log(autoLinks);
  }
  return autoLinks;
};
