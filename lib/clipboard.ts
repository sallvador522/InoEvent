export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // First try the modern async clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      throw new Error('Clipboard API not available or not secure context');
    }
  } catch (error) {
    // Fallback approach using execCommand
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Prevent scrolling to bottom of page in MS Edge.
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = "0";
      // Clean up any borders.
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = "transparent";

      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) return true;
      return false;
    } catch (err) {
      console.error('Fallback clipboard copy failed', err);
      return false;
    }
  }
};
