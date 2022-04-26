<script lang="ts">
    import { onMount } from "svelte";

    let deleteIcon = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDI0IDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojNTZiNTRlO30uY2xzLTJ7ZmlsbDojNjBjYzVhO30uY2xzLTN7ZmlsbDojNmMyZTdjO308L3N0eWxlPjwvZGVmcz48ZyBpZD0iSWNvbnMiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIzLDEyQTExLDExLDAsMCwxLDEsMTJhMTAuODI3LDEwLjgyNywwLDAsMSwuMjktMi41LDExLDExLDAsMCwxLDIxLjQyLDBBMTAuODI3LDEwLjgyNywwLDAsMSwyMywxMloiLz48ZWxsaXBzZSBjbGFzcz0iY2xzLTIiIGN4PSIxMiIgY3k9IjkuNSIgcng9IjEwLjcxIiByeT0iOC41Ii8+PC9nPjxnIGRhdGEtbmFtZT0iTGF5ZXIgNCIgaWQ9IkxheWVyXzQiPjxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEyLDBBMTIsMTIsMCwxLDAsMjQsMTIsMTIuMDEzLDEyLjAxMywwLDAsMCwxMiwwWm0wLDIyQTEwLDEwLDAsMSwxLDIyLDEyLDEwLjAxMSwxMC4wMTEsMCwwLDEsMTIsMjJaIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTYuMjkzLDguMjkzLDEwLDE0LjU4Niw3LjcwNywxMi4yOTNhMSwxLDAsMCwwLTEuNDE0LDEuNDE0bDMsM2ExLDEsMCwwLDAsMS40MTQsMGw3LTdhMSwxLDAsMCwwLTEuNDE0LTEuNDE0WiIvPjwvZz48L3N2Zz4="
    // var allBlocks, suggestionsOutput;
    var suggestions:any;
    var filteredSuggestions:any[]=[];
    var filteredScores:any[]=[];
    const threshold = 0.3;
    var absolutePath:any;
    var javaText:any;

    const formatString = (val: any) => {
    if (val.length >= 20) {
      return (
        val.substring(0, 8) +
        " ...... " +
        val.substring(val.length - 8, val.length)
      );
    }
    // console.log(val);
    return val;
  };

  const handleRemove = (index: any) => {
    filteredSuggestions.splice(index, 1);
    refs.splice(index, 1);
    filteredSuggestions = filteredSuggestions;
    tsvscode.postMessage({
      type: "addSquiggles",
      value: {range: filteredSuggestions,filepath: absolutePath, scores: filteredScores},
    });
  };

  let _refs: any[] = [];
  $: refs = _refs.filter((el) => el);

  const formatLineNo = (val: any) => {
    let str = "【" + val.startLine + " - " + val.endLine + "】";
    // console.log(str);

    return str;
  };

    onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "commentSuggestions") {
        suggestions = message.value.readabilityData;
        absolutePath=message.value.absolutePath;
        javaText=message.value.javaText;
        console.log(suggestions);
        for(let i=0;i<suggestions.allBlocks.length;i++){
          if(suggestions.suggestionsOutput[i]<threshold){
            filteredSuggestions.push(suggestions.allBlocks[i]);
            filteredScores.push(suggestions.suggestionsOutput[i]);
          }
        }
        console.log('filteredSuggestions',filteredSuggestions);
        tsvscode.postMessage({
          type: "addSquiggles",
          value: {range: filteredSuggestions,filepath: absolutePath, scores: filteredScores},
        });
      }
    });
  });
</script>

{#each filteredSuggestions as item}
<div class="suggestion-item">
    <div class="main-item" bind:this={_refs[filteredSuggestions.indexOf(item)]}>
        <div
        class="black"
        on:click={() => {
          tsvscode.postMessage({
            type: "gotoLine",
            value: {
              startLine: item.startLine - 1,
              endLine: item.endLine - 1,
              startCharacter: item.startColumn,
              endCharacter: item.endColumn,
              filepath: absolutePath,
            },
          });
        }}
      >
        <span class="line-number">{formatLineNo(item)}</span>
        <i>{formatString(javaText.substring(item.startOffset,item.endOffset+1))}</i>
        <img
          class="main-img"
          src={deleteIcon}
          alt="delete"
          on:click={() => {
            handleRemove(filteredSuggestions.indexOf(item));
          }}
        />
      </div>
        
      </div>
</div>
{/each}

<style>
    .suggestion-item{
        margin-bottom: 10px;
    }
    .main-item {
        background-color: rgba(0, 0, 0, 0.151);
        width: 100%;
        padding: 2px;
        border: 1px solid rgba(0, 0, 0);
    }
    .main-img {
        width: 18px;
        height: 18px;
        float: right;
        cursor: pointer;
    }
    .black {
        background-color: rgba(0, 0, 0, 0.151);
        cursor: pointer;
        padding: 2px;
    }
</style>
