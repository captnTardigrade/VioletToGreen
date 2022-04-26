<!-- script is required for compilation -->
<script lang="ts">
  import { onMount } from "svelte";
 
  tsvscode.postMessage({
    type: "requestForConfigLinks",
    value: "",
  });

  let deleteIconSrc =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDx0aXRsZS8+CgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSI0MDIiIHdpZHRoPSI1ODIiIHk9Ii0xIiB4PSItMSIvPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxwYXRoIGZpbGw9IiNhMDFjMWMiIGlkPSJzdmdfMSIgZD0ibTM1Ni42NSw0NTBsLTE4NS4xOCwwYTQxLDQxIDAgMCAxIC00MC45LC00MC45bDAsLTI4OC40NGExNSwxNSAwIDAgMSAxNSwtMTVsMjM3LDBhMTUsMTUgMCAwIDEgMTUsMTVsMCwyODguNDRhNDEsNDEgMCAwIDEgLTQwLjkyLDQwLjl6bS0xOTYuMDgsLTMxNC4zNGwwLDI3My40NGExMC45MSwxMC45MSAwIDAgMCAxMC45LDEwLjlsMTg1LjE4LDBhMTAuOTEsMTAuOTEgMCAwIDAgMTAuOTEsLTEwLjlsMCwtMjczLjQ0bC0yMDYuOTksMHoiLz4KICA8cGF0aCBmaWxsPSIjYTAxYzFjIiBpZD0ic3ZnXzIiIGQ9Im0zMjcuMDYsMTM1LjY2bC0xMjYsMGExNSwxNSAwIDAgMSAtMTUsLTE1bDAsLTI3LjI2YTQ0Ljc5LDQ0Ljc5IDAgMCAxIDQ0Ljc0LC00NC43M2w2Ni41MiwwYTQ0Ljc5LDQ0Ljc5IDAgMCAxIDQ0Ljc0LDQ0LjczbDAsMjcuMjZhMTUsMTUgMCAwIDEgLTE1LDE1em0tMTExLC0zMGw5NiwwbDAsLTEyLjI2YTE0Ljc1LDE0Ljc1IDAgMCAwIC0xNC43NCwtMTQuNzNsLTY2LjUyLDBhMTQuNzUsMTQuNzUgMCAwIDAgLTE0LjczLDE0LjczbC0wLjAxLDEyLjI2eiIvPgogIDxwYXRoIGZpbGw9IiNhMDFjMWMiIGlkPSJzdmdfMyIgZD0ibTI2NC4wNiwzOTIuNThhMTUsMTUgMCAwIDEgLTE1LC0xNWwwLC0xOTkuNDlhMTUsMTUgMCAxIDEgMzAsMGwwLDE5OS40OWExNSwxNSAwIDAgMSAtMTUsMTV6Ii8+CiAgPHBhdGggZmlsbD0iI2EwMWMxYyIgaWQ9InN2Z182IiBkPSJtNDA1LjgxLDEzNS42NmwtMjgzLjQ5LDBhMTUsMTUgMCAwIDEgMCwtMzBsMjgzLjQ5LDBhMTUsMTUgMCAwIDEgMCwzMHoiLz4KIDwvZz4KPC9zdmc+";

  var links: any[] = [];

  const handleRemove = (index: any) => {
    links.splice(index, 1);
    refs.splice(index, 1);
    links = links;
    tsvscode.postMessage({
      type: "updateConfigLinks",
      value: links,
    });
  };

  let _refs: any[] = [];
  $: refs = _refs.filter((el) => el);

  const formatString = (val: {
    string: string;
    startLine: string;
    endLine: string;
    startCharacter: string;
    endCharacter: string;
    filepath: string;
    type: string;
  }) => {
    if (val.string.length >= 20) {
      return (
        val.string.substring(0, 8) +
        " ...... " +
        val.string.substring(val.string.length - 8, val.string.length)
      );
    }
    return val.string;
  };

  const formatLineNo = (val: {
    string: string;
    startLine: string;
    endLine: string;
    startCharacter: string;
    endCharacter: string;
    filepath: string;
    type: string;
  }) => {
    let str = "【" + val.startLine + " - " + val.endLine + "】";
    return str;
  };

  const formatPath = (val: string) => {
    let str = val;
    if (str.length > 25) {
      str = " ..." + val.substring(val.lastIndexOf("\\") - 10, val.length);
    }
    return str;
  };

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "configLinks") {
        links = message.value;
        tsvscode.postMessage({
          type: "updateArrayRange",
          value: links,
        });
      } else if (message.type === "saveLinks") {
        tsvscode.postMessage({
          type: "saveLinks",
          value: "",
        });
      }
    });
  });
</script>

{#each links as item}
  <div class="container-item">
    <div class="main-item" bind:this={_refs[links.indexOf(item)]}>
      <span class="title">Link {links.indexOf(item) + 1}</span>
      <img
        class="main-img"
        src={deleteIconSrc}
        alt="delete"
        on:click={() => {
          handleRemove(links.indexOf(item));
        }}
      />
    </div>
    <div>
      <div
        class="green"
        data-tooltip="Path: {formatPath(item[0].filepath)}"
        on:click={() => {
          tsvscode.postMessage({
            type: "gotoLine",
            value: {
              startLine: item[0].startLine - 1,
              endLine: item[0].endLine - 1,
              startCharacter: item[0].startCharacter,
              endCharacter: item[0].endCharacter,
              filepath: item[0].filepath,
              type: 0,
            },
          });
        }}
      >
        <span class="line-number">{formatLineNo(item[0])}</span>
        <i>{formatString(item[0])}</i>
      </div>
      <div
        class="blue"
        data-tooltip="Path: {formatPath(item[1].filepath)}"
        on:click={() => {
          tsvscode.postMessage({
            type: "gotoLine",
            value: {
              startLine: item[1].startLine - 1,
              endLine: item[1].endLine - 1,
              startCharacter: item[1].startCharacter,
              endCharacter: item[1].endCharacter,
              filepath: item[1].filepath,
              type: 1,
            },
          });
        }}
      >
        <span class="line-number">{formatLineNo(item[1])}</span>
        <i>{formatString(item[1])}</i>
      </div>
    </div>
  </div>
{/each}

<style>
  .container-item {
    margin-bottom: 10px;
  }
  .blue {
    background-color: rgb(146, 54, 238, 0.151);
    cursor: pointer;
    padding: 2px;
  }
  .green {
    background-color: rgb(26, 204, 44, 0.2);
    cursor: pointer;
    padding: 2px;
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
  .title {
    padding: 2px;
  }
  .line-number {
    font-size: 10px;
  }
  [data-tooltip] {
    position: relative;
    z-index: 2;
    display: block;
  }

  [data-tooltip]:before,
  [data-tooltip]:after {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transition: 0.2s ease-out;
    transform: translate(-50%, 5px);
  }

  [data-tooltip]:before {
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-bottom: 5px;
    padding: 7px;
    width: 100%;
    min-width: 70px;
    max-width: 250px;
    -webkit-border-radius: 3px;
    -moz-border-radius: 3px;
    border-radius: 3px;
    background-color: #000;
    background-color: hsla(0, 10%, 10%, 0.9);
    color: #fff;
    content: attr(data-tooltip);
    text-align: center;
    font-size: 12px;
    line-height: 1.2;
    transition: 0.2s ease-out;
  }

  [data-tooltip]:after {
    position: absolute;
    bottom: 100%;
    left: 50%;
    width: 0;
    border-top: 5px solid #000;
    border-top: 5px solid hsla(0, 0%, 20%, 0.9);
    border-right: 5px solid transparent;
    border-left: 5px solid transparent;
    content: " ";
    font-size: 0;
    line-height: 0;
  }

  [data-tooltip]:hover:before,
  [data-tooltip]:hover:after {
    visibility: visible;
    opacity: 1;
    transform: translate(-50%, 0);
  }
  [data-tooltip="false"]:hover:before,
  [data-tooltip="false"]:hover:after {
    visibility: hidden;
    opacity: 0;
  }
</style>
