
exports.embedImages = function embedImages(content) {
  content = content.replace(/#o#/gi, '<');
  content = content.replace(/#c#/gi, '>');
  return content;
}

