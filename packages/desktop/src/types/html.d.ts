// Extend HTMLInputElement to include webkitdirectory
interface HTMLInputElement {
  webkitdirectory: boolean;
  directory: boolean;
  webkitRelativePath?: string;
}

interface File {
  webkitRelativePath?: string;
}