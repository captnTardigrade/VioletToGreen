# VioletToGreen

## About
VioletToGreen is a VS Code extension that leverages a novel method of linking comments to code, suggesting where to insert comments and reminding the developer to update comments when corresponding code is updated, to improve understandability and maintainability of code.

[Demo Video](https://www.youtube.com/watch?v=hoB6W9PUY4A)

## Abstract
The aim of the project is to improve understandability and maintainability of the code by leveraging the comments written by the user. Developers often tend to forget to update the corresponding comments after updating the code, which leads to less maintaiability over time. Our tool aims at tackling this problem in a novel way. The tool is delivered in the form of a VS Code extension which helps the programmer maintain the readability on the fly. The tool has 2 main features i.e, automatically linking the comments and code, and suggesting where to insert a commnet based on a custom readability metric. The linking of comments is done in both manual and automatic ways. For manual linking, appropriate GUI has been implemented and these links will be stored in a file. For automatic linking, a few heuristic rules have been devised based on the commenting habits of a typical programmer keeping mind various cases possible including some anomalous ones. For insert comment suggestion functionality, we are analysing various source code components (functions, blocks, loops, etc.) and predicting readability score. We use this readability score along with the code-to-comment ratio to decide whether a comment is needed or not, based on a threshold value for both the metrics. Once the linking is done, in the future if the user edits a piece of code that is linked, the tool prompts the user to update the corresponding comment. This linking is also useful when a programmer is trying to understand a code base, in which case the tool helps the user to visualize exactly which part of the code is linked to which comment.

## Objectives
The main objectives of the tool include linking code to comment either manually or automatically. Prompting the user to update a particular comment after the linked code has been modified. Suggests where to insert a comment based on the custom readability score.

## UI Features
1. As soon as the extension is active, a dedicated side panel opens up with three sub panels.

<img src="https://user-images.githubusercontent.com/58718144/161588846-5893f14e-218d-4281-b6af-ce4f27f14d1c.png" height="350px"></img>

2. Highlight a comment or a code snippet and click on **Select** to select and link them.

<img src="https://user-images.githubusercontent.com/58718144/161590252-e7af3fe8-8cd7-4796-a18a-95427a031fc7.png" height="350px"></img>

3. Click on **Link** to link them. The linked snippets will be displayed in the **LINKS** panel.
4. Placing the cursor on either the linked comment will highlight the corresponding code snippet and vice-versa. Comments are highlighted in blue and code snippets in green.

<img src="https://user-images.githubusercontent.com/58718144/161590673-2be178ea-95ec-412b-8f22-5d8453bb38e2.png" height="350px"></img>

5. If a highlighted region is edited by the user, the linked region will also adapt to include or exclude the new set of lines.
6. A link can also be present across two different files. The path of each snippet in each link will be displayed in the tooltip component.
7. Clicking on the blue and green regions on the side panel will make the editor navigate to the appropriate linked positions by displaying the comment on the left and the corresponding code snippet on the right of a split window.

<img src="https://user-images.githubusercontent.com/58718144/161591435-4a15b5a5-3caa-4938-9334-1b5ac6256233.png" height="380px"></img>

8. The links panel also displays the automatically created links invoked by the user.
9. Any link can be deleted by clicking on the delete icon of the corresponding link on the left panel.
10. The links are saved in a config file so that the links will persist in all sessions of VS Code. The config file can also be shared with different users so that they will also be provided with the same links and highlights.
11. The middle panel hosts the functionality to display suggestions on where to insert comments, which is invoked by the user.

<img src="https://user-images.githubusercontent.com/58718144/165748692-da5943fe-07f3-46bc-bff2-6db8da8246a1.png" height="380px"></img>

12. Each list item in the middle panel is clickable and navigates to the position of the suggestion upon clicking.

<img src="https://user-images.githubusercontent.com/58718144/165751465-d3c2effb-0a82-4ead-871e-cb5fa34f4af6.png" height="380px"></img>

13. Each suggestion also adds an information squiggle in the editor wherever a comment insertion is required. Upon hovering, a hover box appears which displays the relevant grasp score of that code snippet.

<img src="https://user-images.githubusercontent.com/58718144/165754915-1d82defc-b78f-49e1-8a95-9dfb70e520b2.png" height="280px"></img>

15. The suggestions can be individually resolved by clicking on the tick icon on the right. This will delete that particular suggestion from the list.
16. The extension displays a warning message in case the user has modified the code and has not modified the corresponding linked comment. This check is triggered after every save file event.

<img src="https://user-images.githubusercontent.com/58718144/165757063-824ba3f2-b100-4bee-8e72-ffcb04572ed3.png" height="300px"></img>

## Other Features
1. The extension becomes active on VS Code startup and the webview side panel will open up.
2. The links generated are stored in a file called violettogreen.config.json. Sharing this file will enable other users to view all the links created by different users.
3. The *Link Automatically* command sends the code to the server which runs an ML model to detect whether a comment is a commented out code snippet or not.
4. The *Suggest Insert Comments* also sends the code to the server that parses the file and calculates the RUM metric, comment to code ratio for each sample snippet and returns this value to the client.

## Instructions

1. Clone this repository.
2. Run the following commands:

```
$ npm install
$ npm run watch
```

3. Click on <kbd>F5</kbd> to run.
4. Clone the [server repository](https://github.com/AASHRITH1903/VioletToGreen_Server) in a different directory.
5. Run the following to start the server:

```
$ node server
```

## Commands
1. *Link Automatically* will link comments and code snippets automatically based on carefully laid out heuristics.
2. *Suggest Insert Comments* will evaluate the currently open file based on the RUM metric and provide a list of suggestions on comment insertion.
