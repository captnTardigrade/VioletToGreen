<script lang="ts">
    import { onMount } from "svelte";

    // var allBlocks, suggestionsOutput;
    var suggestions;
    var filteredSuggestions;
    const threshold = 3;
    var absolutePath;
    var javaText;

    const formatString = (val: any) => {
    if (val.string.length >= 20) {
      return (
        val.string.substring(0, 8) +
        " ...... " +
        val.string.substring(val.string.length - 8, val.string.length)
      );
    }
    return val.string;
  };

  const formatLineNo = (val: any) => {
    let str = "【" + val.startLine + " - " + val.endLine + "】";
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
        for(let i=0;i<suggestions.length;i++){
          if(suggestions[i].suggestionsOutput<threshold){
            filteredSuggestions.push(suggestions[i]);
          }
        }
      }
    });
  });
</script>

{#each filteredSuggestions.allBlocks as item}
<div class="suggestion-item">
    <div class="main-item" bind:this={_refs[suggestions.indexOf(item)]}>
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
        <i>{formatString(javaText.substr(item.startOffset,item.endOffset+1))}</i>
        <img
          class="main-img"
          src={resolveIcon}
          alt="delete"
          on:click={() => {
            
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
